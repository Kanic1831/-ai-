
import { CalibrationLog, QueryResult } from '../types';
import { ObservationFormData } from '../components/ObservationForm';
import { GoogleGenAI, Type } from "@google/genai";

// Ensure API_KEY environment variable is set
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const predictionSchema = {
  type: Type.OBJECT,
  properties: {
    value: { type: Type.STRING },
    confidence: { type: Type.NUMBER, description: "A value between 0 and 1." },
  },
  required: ['value', 'confidence'],
};

const matchedTargetSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: "A unique identifier for this target, e.g., 'lang-001'." },
    title: { type: Type.STRING, description: "The title of the matched developmental goal." },
    source: { type: Type.STRING, description: "The source of the goal, e.g., '《指南》语言.4.2' or '来自您上传的文档'." },
    evidence: { type: Type.STRING, description: "A direct quote or a very close paraphrase from the original observation text that supports this match." },
    confidence: { type: Type.NUMBER, description: "A value between 0 and 1, representing the confidence in this match." },
    suggested_observations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Two concrete, actionable suggestions for what the teacher can observe next."
    },
  },
  required: ['id', 'title', 'source', 'evidence', 'confidence', 'suggested_observations'],
};

const queryResultSchema = {
  type: Type.OBJECT,
  properties: {
    queryId: { type: Type.STRING, description: "A unique identifier for this query, starting with 'qry-'." },
    inputText: { type: Type.STRING, description: "The original observation text provided by the user." },
    domainPrediction: { ...predictionSchema, description: "The primary developmental domain predicted." },
    agePrediction: { ...predictionSchema, description: "The predicted age group based on the observation." },
    matchedTargets: {
      type: Type.ARRAY,
      description: "An array of 1 to 3 matched developmental targets, ordered by confidence.",
      items: matchedTargetSchema,
    },
  },
  required: ['queryId', 'inputText', 'domainPrediction', 'agePrediction', 'matchedTargets'],
};

export const extractEvidence = async (observationText: string): Promise<string[]> => {
    if (!observationText.trim()) {
        return [];
    }

    const systemInstruction = `你的角色是一位资深的学前教育专家。你的任务是从用户提供的幼儿观察记录中，提取出最能体现幼儿内在思考、能力发展和情感状态的“高价值”关键证据。

你的判断标准需要非常严格，专注于“高价值”的瞬间，而不是简单罗列行为。

**黄金教学案例 (请学习这些范例的判断逻辑):**
- **案例1 (音乐活动)**:
  - 原始记录: "乐颜打开音响播放小星星快板，听了几句又换成了慢板，同样听几句后又换成了快板...她调整放慢了节奏，能够跟上慢板的乐曲。"
  - 专家提取的证据: ["她调整放慢了节奏，能够跟上慢板的乐曲。"] (这体现了“发现问题->解决问题”的能力，价值最高)
- **案例2 (科学活动)**:
  - 原始记录: "忻悦拿起U形磁铁...说:‘这个U形磁铁没有长方形磁铁的吸力大...’。他又分别拿起圆形磁铁和环形磁铁靠近金属材料...一边尝试一边告诉我:‘圆形磁铁吸得比U形多,但是比长方形少。环形的吸得最多。’"
  - 专家提取的证据: ["他拿起一个长条形磁铁轻轻靠近金属材料,发现长条形磁铁吸到了两个螺栓和几个回形针。", "随手拿起U形磁铁,用相同的方法吸到了一个回形针。", "圆形磁铁吸得比U形多,但是比长方形少。环形的吸得最多。"] (这体现了“有条理的探索过程”和“比较与结论”，价值很高)

**高价值证据的判断标准 (优先提取):**
1.  **认知飞跃**: 寻找体现“顿悟”、得出结论、解决问题或创造性思维的瞬间。 (如案例1和2)
2.  **科学探究过程**: 捕捉有条理的、一步步的探索行为本身，以及发起共同探究的语言。（如案例2的探索过程）
3.  **创造性应用**: 关注幼儿将学到的知识或技能应用到新情境中的行为。例如，“他用磁铁和螺帽搭了一个机器人,下面垫个磁铁机器人站得更稳了。”

**需要忽略或过滤的内容：**
- **教师的旁白和总结** (例如: "这个比较不同磁铁的吸力游戏持续了12分钟。")
- 教师的行为、语言和环境设置。
- 简单的、不包含深度思考的陈述性行为。

你的输出必须是一个JSON数组，其中只包含你找到的关键证据字符串。不要返回任何其他内容或解释。`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: observationText }] }],
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
                temperature: 0.1,
            },
        });
        const result = JSON.parse(response.text);
        return result as string[];
    } catch (error) {
        console.error("Error extracting evidence:", error);
        throw new Error("提取关键证据时出错。");
    }
};

const formatLogsForPrompt = (logs: CalibrationLog[]): string => {
  if (!logs || logs.length === 0) return '';

  const highQualityLogs = logs
    .filter(log => log.calibratedEvidence.length > 0)
    .slice(0, 2);

  if (highQualityLogs.length === 0) return '';

  const examples = highQualityLogs.map((log, index) => {
    return `
### 专家校准范例 #${index + 1}
- **原始记录**: "${log.originalText}"
- **专家校准后的关键证据**: ${JSON.stringify(log.calibratedEvidence)}
    `;
  }).join('');

  return `
---
**请优先学习并模仿以下由专家校准过的黄金范例，以提升你分析的准确性：**
${examples}
---
  `;
};


export const queryGuide = async (
  data: ObservationFormData,
  calibrationLogs?: CalibrationLog[]
): Promise<QueryResult> => {
    
  const { observationText, ageGroup, knowledgeBase, keyEvidence } = data;

  console.log('Sending real query to Gemini:', { 
    observationText, 
    ageGroup, 
    knowledgeBaseProvided: !!knowledgeBase, 
    calibratedEvidenceCount: keyEvidence?.length,
    logsForFewShot: calibrationLogs?.filter(l => l.calibratedEvidence.length > 0).length 
  });

  let systemInstruction = `你是一位顶尖的儿童早期教育专家，对中国的《3-6岁儿童学习与发展指南》了如指掌。你的任务是分析教师提供的幼儿观察记录，并以结构化的JSON格式返回你的专业评估。

规则：
1.  **分析输入**：仔细阅读教师的观察记录（'inputText'）和指定的幼儿年龄段（'ageGroup'）。
2.  **知识库优先**：如果提供了自定义知识库（'knowledgeBase'），你必须优先依据该文档内容进行分析。此时，所有匹配目标的'source'字段必须为“来自您上传的文档”。如果未提供，则依据你内置的《指南》知识。
3.  **提取关键证据**：'evidence'字段必须是直接引用或高度概括观察记录中的原话，这是证明你的匹配是循证的、而不是凭空捏造的关键。
4.  **核心预测**：判断观察记录最能体现的核心发展领域（'domainPrediction'）和最匹配的年龄段（'agePrediction'），并给出置信度（0到1之间）。
5.  **匹配发展目标**：找出1-3个最相关的具体发展目标（'matchedTargets'），并按置信度从高到低排序。
6.  **提供观察建议**：为每个匹配的目标提供2条具体的、可操作的“即时观察项”（'suggested_observations'），帮助教师进行下一步观察。
7.  **JSON输出**：你的回答必须是严格遵循所提供schema的单个JSON对象，不要包含任何额外的解释、注释或markdown标记。`;

  // If calibrated evidence is provided, switch to a high-priority, focused instruction set.
  if (keyEvidence && keyEvidence.length > 0) {
    systemInstruction = `你是一位顶尖的儿童早期教育专家。你的任务是进行一次高度聚焦的分析。一位专家用户已经为你从原始观察记录中提取出了最关键的“黄金证据”列表。

**最高优先级指令：**
1.  **唯一依据**：你的所有分析，尤其是'matchedTargets'中的'evidence'字段，**必须且只能**基于我提供给你的“黄金证据”列表。
2.  **禁止自由发挥**：**严禁**从原始文本中寻找“黄金证据”列表之外的其他信息作为证据。你的任务是解释和关联这份已确认的证据，而不是去发现新证据。
3.  **核心任务**：基于这份黄金证据，完成以下工作：
    a.  判断最匹配的核心发展领域（'domainPrediction'）和年龄段（'agePrediction'）。
    b.  找出1-3个与这份证据最相关的具体发展目标（'matchedTargets'）。
    c.  为每个目标提供2条具体的“即时观察项”（'suggested_observations'）。
    d.  如果提供了自定义知识库，优先使用它，并确保'source'字段为“来自您上传的文档”。
4.  **JSON输出**：你的回答必须是严格遵循所提供schema的单个JSON对象。`;
  } else {
    const fewShotExamples = formatLogsForPrompt(calibrationLogs || []);
    systemInstruction = fewShotExamples + systemInstruction;
  }
  
  const userPrompt = `
    请根据以下信息进行分析:

    - **观察记录 (inputText)**: "${observationText}"
    - **幼儿年龄段 (ageGroup)**: "${ageGroup}"
    ${knowledgeBase ? `- **自定义知识库 (knowledgeBase)**: """${knowledgeBase}"""` : ''}
    ${(keyEvidence && keyEvidence.length > 0) ? `- **专家确认的黄金证据 (Golden Evidence)**: ${JSON.stringify(keyEvidence)}` : ''}
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: queryResultSchema,
          temperature: 0.2,
        },
    });

    const responseText = response.text;
    const resultJson = JSON.parse(responseText);
    
    resultJson.inputText = observationText;

    console.log('AI Response:', resultJson);
    return resultJson as QueryResult;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error('AI 服务在生成分析时遇到问题，请稍后重试。');
  }
};


export const getGrowthInsightAnalysis = async (log: Pick<CalibrationLog, 'originalText' | 'aiInitialEvidence' | 'calibratedEvidence'>): Promise<string> => {
    const systemInstruction = `你的角色是一位资深的AI学习分析师和教育研究员。你的任务是分析一次AI证据提取的校准过程，并提炼出专家校准行为背后所蕴含的核心教育思想和循证原则。

你的分析需要回答“为什么”而不是“是什么”。不要简单地罗列差异，而是要总结出更高层次的原则。

**输入格式:**
你会收到三部分信息：
1.  **原始记录**: 教师写的完整观察文本。
2.  **AI判定**: AI模型初步提取的关键证据列表。
3.  **人工校准**: 教育专家最终确认的“黄金证据”列表。

**输出要求:**
你的输出必须是一段简洁、深刻的分析文字。根据差异，你可以从以下一个或多个角度进行总结：

-   **【AI学到的新原则】**: 当“人工校准”比“AI判定”增加了证据时，总结这些新增证据体现了什么更深层次的观察原则。
    -   *示例*: "专家本次校准，让AI学会了要更关注**描述儿童从遇到问题到自主调整策略并最终解决问题的完整行为链条**，而不仅仅是孤立的行为。"
-   **【AI修正的旧原则】**: 当“人工校准”比“AI判定”删除了证据时，总结这些被删除的证据为什么不被视为高价值证据。
    -   *示例*: "AI认识到，在音乐探索活动中，**儿童对节奏、音色的具体操作和模仿**，比简单的切换曲目更能体现其探究深度。"
-   **【判断得到巩固】**: 如果两个版本完全一致，请明确指出。
    -   *示例*: "AI的判断与专家完全一致，其关于‘**有条理的科学探究过程**’的证据提取能力得到了验证和巩固。"

请直接输出你的分析结论，语言要专业、精炼。`;

    const userPrompt = `
    请根据以下校准记录进行元认知分析:

    - **原始记录**: 
    """
    ${log.originalText}
    """

    - **AI判定**: 
    ${JSON.stringify(log.aiInitialEvidence)}

    - **人工校准**: 
    ${JSON.stringify(log.calibratedEvidence)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            config: {
                systemInstruction,
                temperature: 0.3,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error getting growth insight analysis:", error);
        return "分析学习成果时出错，请稍后重试。";
    }
};
