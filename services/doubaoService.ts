
import { QueryResult } from '../types';
import { ObservationFormData } from '../components/ObservationForm';

const API_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

// Helper to handle API calls
const callDoubaoAPI = async (apiKey: string, payload: object) => {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        let errorMsg = response.statusText;
        try {
            const errorBody = await response.json();
            console.error("Doubao API Error Body:", JSON.stringify(errorBody, null, 2));
            // Doubao error format is often { "error": { "message": "...", "code": "..." } }
            if (errorBody && errorBody.error && errorBody.error.message) {
                errorMsg = errorBody.error.message;
            } else if (typeof errorBody === 'string') {
                errorMsg = errorBody;
            }
        } catch (e) {
            // The body wasn't JSON, just use the status text.
        }
        throw new Error(`豆包 API 请求失败: ${errorMsg}`);
    }

    return response.json();
};

const extractEvidenceSchema = {
    type: "object",
    properties: {
        evidence: {
            type: "array",
            items: { "type": "string" },
            description: "An array of key evidence strings extracted from the text."
        }
    },
    required: ["evidence"]
};

export const extractEvidence = async (observationText: string, apiKey: string, modelEndpoint: string): Promise<string[]> => {
    const systemInstruction = `你的角色是一位资深的学前教育专家。你的任务是从用户提供的幼儿观察记录中，提取出最能体现幼儿内在思考、能力发展和情感状态的“高价值”关键证据。

你的判断标准需要非常严格，专注于“高价值”的瞬间，而不是简单罗列行为。

**黄金教学案例 (请学习这些范例的判断逻辑):**
- **案例1 (音乐活动)**:
  - 原始记录: "乐颜打开音响播放小星星快板，听了几句又换成了慢板，同样听几句后又换成了快板...她调整放慢了节奏，能够跟上慢板的乐曲。"
  - 专家提取的证据: ["她调整放慢了节奏，能够跟上慢板的乐曲。"]
- **案例2 (科学活动)**:
  - 原始记录: "忻悦拿起U形磁铁...说:‘这个U形磁铁没有长方形磁铁的吸力大...’。他又分别拿起圆形磁铁和环形磁铁靠近金属材料...一边尝试一边告诉我:‘圆形磁铁吸得比U形多,但是比长方形少。环形的吸得最多。’"
  - 专家提取的证据: ["圆形磁铁吸得比U形多,但是比长方形少。环形的吸得最多。"]

**高价值证据的判断标准 (优先提取):**
1.  **认知飞跃**: 寻找体现“顿悟”、得出结论、解决问题或创造性思维的瞬间。
2.  **科学探究过程**: 捕捉有条理的、一步步的探索行为本身。
3.  **创造性应用**: 关注幼儿将学到的知识或技能应用到新情境中的行为。

**需要忽略或过滤的内容：**
- **教师的旁白和总结**
- 教师的行为、语言和环境设置。
- 简单的、不包含深度思考的陈述性行为。`;

    const payload = {
        model: modelEndpoint,
        messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: `请根据以上原则，从以下观察记录中提取关键证据: "${observationText}"` }
        ],
        tools: [{ type: "function", function: { name: "extract_evidence", description: "从观察记录中提取关键证据。", parameters: extractEvidenceSchema } }],
        tool_choice: { type: "function", function: { name: "extract_evidence" } }
    };

    const response = await callDoubaoAPI(apiKey, payload);
    try {
        const message = response.choices?.[0]?.message;
        if (!message) {
            console.error("Doubao response invalid format:", response);
            throw new Error("豆包模型返回的响应中没有有效信息。");
        }

        // Attempt 1: Get from tool_calls (preferred)
        const toolCall = message.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
            const args = JSON.parse(toolCall.function.arguments);
            if (args && Array.isArray(args.evidence)) {
                return args.evidence;
            }
        }

        // Attempt 2 (Fallback): Parse from message.content if model returns raw JSON
        if (typeof message.content === 'string' && message.content.trim().startsWith('{')) {
            try {
                const contentJson = JSON.parse(message.content);
                if (contentJson && Array.isArray(contentJson.evidence)) {
                    return contentJson.evidence;
                }
            } catch (parseError) {
                console.warn("Could not parse message.content as JSON, though it looked like it.", parseError);
            }
        }
        
        console.error("Doubao response did not contain a valid tool call or parsable JSON content:", response);
        throw new Error("豆包模型未能按预期返回结构化证据。请检查模型是否支持工具调用或JSON输出。");

    } catch (e) {
        console.error("Failed to parse Doubao evidence extraction response:", e, response);
        if (e instanceof Error) {
            throw new Error(`解析豆包模型返回结果时出错: ${e.message}`);
        }
        throw new Error("解析豆包模型返回结果时出现未知错误。");
    }
};

const queryResultSchema = {
  type: "object",
  properties: {
    queryId: { type: "string", description: "A unique identifier for this query, starting with 'qry-doubao-'." },
    domainPrediction: {
      type: "object",
      properties: { value: { type: "string" }, confidence: { type: "number" } },
      required: ["value", "confidence"]
    },
    agePrediction: {
      type: "object",
      properties: { value: { type: "string" }, confidence: { type: "number" } },
      required: ["value", "confidence"]
    },
    matchedTargets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          source: { type: "string" },
          evidence: { type: "string" },
          confidence: { type: "number" },
          suggested_observations: { type: "array", items: { type: "string" } }
        },
        required: ["id", "title", "source", "evidence", "confidence", "suggested_observations"]
      }
    }
  },
  required: ["queryId", "domainPrediction", "agePrediction", "matchedTargets"]
};

export const queryGuide = async (
  data: ObservationFormData,
  apiKey: string,
  modelEndpoint: string,
): Promise<QueryResult> => {
    const { observationText, ageGroup, knowledgeBase, keyEvidence } = data;

    let systemInstruction = `你是一位顶尖的儿童早期教育专家，对中国的《3-6岁儿童学习与发展指南》了如指掌。你的任务是分析教师提供的幼儿观察记录，并以结构化的JSON格式返回你的专业评估。
    规则：
    1.  **分析输入**：仔细阅读教师的观察记录和指定的幼儿年龄段。
    2.  **知识库优先**：如果提供了自定义知识库，必须优先依据该文档内容进行分析，此时所有匹配目标的'source'字段必须为“来自您上传的文档”。
    3.  **循证分析**：'evidence'字段必须是直接引用或高度概括观察记录中的原话。
    4.  **核心预测**：判断核心发展领域和最匹配的年龄段，并给出置信度。
    5.  **匹配目标**：找出1-3个最相关的具体发展目标，并按置信度从高到低排序。
    6.  **提供建议**：为每个匹配的目标提供2条具体的“即时观察项”。
    7.  **JSON输出**：你的回答必须是严格遵循所定义的function call schema的JSON对象。`;
    
    if (keyEvidence && keyEvidence.length > 0) {
        systemInstruction = `你是一位顶尖的儿童早期教育专家。你的任务是进行一次高度聚焦的分析。一位专家用户已经为你从原始观察记录中提取出了最关键的“黄金证据”列表。
        **最高优先级指令：**
        1.  **唯一依据**：你的所有分析，尤其是'matchedTargets'中的'evidence'字段，**必须且只能**基于我提供给你的“黄金证据”列表。
        2.  **禁止自由发挥**：**严禁**从原始文本中寻找“黄金证据”列表之外的其他信息作为证据。
        3.  **核心任务**：基于这份黄金证据，完成发展领域判断、目标匹配和观察建议。
        4.  **JSON输出**：你的回答必须是严格遵循所定义的function call schema的JSON对象。`;
    }

    const userPrompt = `
    请根据以下信息进行分析:

    - **观察记录**: "${observationText}"
    - **幼儿年龄段**: "${ageGroup}"
    ${knowledgeBase ? `- **自定义知识库**: """${knowledgeBase}"""` : ''}
    ${(keyEvidence && keyEvidence.length > 0) ? `- **专家确认的黄金证据**: ${JSON.stringify(keyEvidence)}` : ''}
    `;
    
    const payload = {
        model: modelEndpoint,
        messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt }
        ],
        tools: [{ type: "function", function: { name: "generate_analysis", description: "Generate a structured analysis of the observation record.", parameters: queryResultSchema } }],
        tool_choice: { type: "function", function: { name: "generate_analysis" } }
    };

    const response = await callDoubaoAPI(apiKey, payload);
    try {
        const message = response.choices?.[0]?.message;
        if (!message) {
            throw new Error("豆包模型返回的响应中没有有效信息。");
        }

        // Attempt 1: Get from tool_calls (preferred)
        const toolCall = message.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
            const args = JSON.parse(toolCall.function.arguments);
            const finalResult: QueryResult = { ...args, inputText: observationText };
            return finalResult;
        }
        
        // Attempt 2 (Fallback): Parse from message.content if model returns raw JSON
        if (typeof message.content === 'string' && message.content.trim().startsWith('{')) {
            try {
                const args = JSON.parse(message.content);
                // Basic check to see if it looks like our schema
                if (args.queryId && args.matchedTargets) {
                    const finalResult: QueryResult = { ...args, inputText: observationText };
                    return finalResult;
                }
            } catch (parseError) {
                console.warn("Could not parse message.content as JSON in queryGuide.", parseError);
            }
        }

        throw new Error("豆包模型未能返回有效的分析结构。");
    } catch (e) {
        console.error("Failed to parse Doubao query guide response:", e);
        throw new Error("豆包模型返回的分析结果格式无法解析。");
    }
};
