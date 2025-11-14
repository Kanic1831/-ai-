import React, { useState, FormEvent, useRef, useEffect, ChangeEvent } from 'react';
import { AgeGroup } from '../types';
import { extractEvidence } from '../services/guideService';
import { Spinner } from './Spinner';

declare const pdfjsLib: any;
declare const mammoth: any;

export interface ObservationFormData {
  observationText: string;
  ageGroup: AgeGroup;
  knowledgeBase?: string;
  keyEvidence?: string[];
  aiInitialEvidence: string[];
}

interface ObservationFormProps {
  onSubmit: (data: ObservationFormData) => void;
  isLoading: boolean;
  isResultView: boolean;
  onNewQuery: () => void;
}

const NewQueryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /> </svg> );
const FileUploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 13.5v-3a3.375 3.375 0 013.375-3.375h3.75m-3.75 0V6a3.375 3.375 0 013.375-3.375h3.75m3.75 0V3.375A3.375 3.375 0 0116.5 0h-3.75m3.75 3.375h3.75a3.375 3.375 0 013.375 3.375v3m-3.75 0h3.75a3.375 3.375 0 013.375 3.375v3.75a3.375 3.375 0 01-3.375 3.375h-3.75m-3.75 0h-3.75a3.375 3.375 0 01-3.375-3.375v-3.75m3.75 0v3.75a3.375 3.375 0 01-3.375-3.375H6.75" /> </svg> );
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /> </svg> );
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /> </svg> );
const XCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /> </svg> );
const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /> </svg> );
const CalibrateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg> );

export const ObservationForm: React.FC<ObservationFormProps> = ({ onSubmit, isLoading, isResultView, onNewQuery }) => {
  const [observationText, setObservationText] = useState<string>('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(AgeGroup.FOUR_TO_FIVE);
  const [knowledgeFile, setKnowledgeFile] = useState<File | null>(null);
  const [knowledgeFileContent, setKnowledgeFileContent] = useState<string>('');
  const [fileStatus, setFileStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const [fileStatusMessage, setFileStatusMessage] = useState<string>('');
  
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [canCalibrate, setCanCalibrate] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [aiInitialEvidence, setAiInitialEvidence] = useState<string[]>([]);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setKnowledgeFile(file);
    setFileStatus('parsing');
    setFileStatusMessage('正在读取文件...');

    try {
      let textContent = '';
      if (file.type === 'text/plain' || file.type === 'text/markdown') {
        setFileStatusMessage('正在解析文本文件...');
        textContent = await file.text();
      } else if (file.type === 'application/pdf') {
        setFileStatusMessage('正在解析 PDF 文件...');
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ');
        }
        textContent = text;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setFileStatusMessage('正在解析 DOCX 文件...');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        textContent = result.value;
      } else {
        throw new Error('不支持的文件格式。');
      }
      setKnowledgeFileContent(textContent);
      setFileStatus('success');
      setFileStatusMessage(''); // Clear message on success, the UI below will show the status
    } catch (err) {
      console.error(err);
      setFileStatus('error');
      setFileStatusMessage(err instanceof Error ? err.message : '文件解析失败。');
      setKnowledgeFile(null);
      setKnowledgeFileContent('');
    } finally {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };

  const handleRemoveFile = () => {
    setKnowledgeFile(null);
    setKnowledgeFileContent('');
    setFileStatus('idle');
    setFileStatusMessage('');
     if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };
    
  const handleExtractEvidence = async () => {
    if (!editorRef.current || !observationText.trim()) return;

    setIsHighlighting(true);
    setCanCalibrate(false);
    setIsCalibrating(false);
    setAiInitialEvidence([]);
    try {
        const plainText = editorRef.current.innerText;
        setObservationText(plainText); // Sync state before extraction
        
        const evidencePhrases = await extractEvidence(plainText);
        setAiInitialEvidence(evidencePhrases); // Save AI's initial guess for logging
        
        let content = plainText;
        const uniquePhrases = [...new Set(evidencePhrases)];
        uniquePhrases.sort((a, b) => b.length - a.length); 

        uniquePhrases.forEach(phrase => {
            const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedPhrase})`, 'g');
            content = content.replace(regex, `<span class="bg-yellow-200 dark:bg-yellow-800/60 rounded px-1 py-0.5">${'$1'}</span>`);
        });
        editorRef.current.innerHTML = content;
        setCanCalibrate(true);
    } catch (error) {
        console.error("Failed to extract evidence", error);
        alert(`提取证据失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
        setIsHighlighting(false);
    }
  };

  const handleStartCalibration = () => {
    setIsCalibrating(true);
    setCanCalibrate(false);
  };

  const handleAddHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = "bg-yellow-200 dark:bg-yellow-800/60 rounded px-1 py-0.5";
    try {
        range.surroundContents(span);
    } catch (e) {
        console.warn("Could not wrap the current selection.", e)
    } finally {
        selection.removeAllRanges();
    }
  };

  const handleRemoveHighlight = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCalibrating) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'SPAN' && target.className.includes('bg-yellow-200')) {
        const parent = target.parentNode;
        if (parent) {
            while (target.firstChild) {
                parent.insertBefore(target.firstChild, target);
            }
            parent.removeChild(target);
            parent.normalize();
        }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const currentText = editorRef.current?.innerText || '';
    setObservationText(currentText);

    let finalEvidence: string[] = [];
    if (editorRef.current) {
        const highlightedSpans = editorRef.current.querySelectorAll('span.bg-yellow-200');
        highlightedSpans.forEach(span => {
            finalEvidence.push((span as HTMLElement).innerText);
        });
    }
    
    onSubmit({
      observationText: currentText,
      ageGroup,
      knowledgeBase: knowledgeFileContent,
      keyEvidence: finalEvidence,
      aiInitialEvidence,
    });
  };
  
  if (isResultView) {
    return (
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">分析结果</h2>
        <button onClick={onNewQuery} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-colors">
          <NewQueryIcon className="w-5 h-5" />
          新的观察
        </button>
      </div>
    );
  }
  
  const isParsing = fileStatus === 'parsing';
  const isBusy = isLoading || isParsing || isHighlighting;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="observation" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
          观察记录
        </label>
        <div className="relative">
          <div
            id="observation"
            ref={editorRef}
            contentEditable={!isBusy}
            onInput={(e) => {
                setObservationText(e.currentTarget.innerText);
                // If user edits text, reset highlights and calibration mode
                if(canCalibrate || isCalibrating) {
                    e.currentTarget.innerHTML = e.currentTarget.innerText;
                }
                setCanCalibrate(false);
                setIsCalibrating(false);
            }}
            onClick={handleRemoveHighlight}
            data-placeholder="例如：小明在美工区用剪刀剪出不同形状的纸片，并用胶水粘贴成了一幅画..."
            className="w-full min-h-[120px] p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-y overflow-auto prose prose-sm dark:prose-invert max-w-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-slate-400 [&:empty]:before:dark:text-slate-500"
          />
        </div>

        {isCalibrating && (
             <div className="mt-2 p-2 bg-blue-50 dark:bg-slate-700/50 border border-blue-200 dark:border-slate-600 rounded-lg flex items-center justify-between transition-all duration-300 animate-fade-in">
                <div>
                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">校准模式</p>
                    <p className="text-xs text-blue-600 dark:text-slate-400">选择文本可添加高亮，点击高亮区域可移除。</p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={handleAddHighlight} className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">添加高亮</button>
                    <button type="button" onClick={() => setIsCalibrating(false)} className="px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 dark:bg-slate-600 dark:text-slate-200 dark:border-slate-500 dark:hover:bg-slate-500">完成校准</button>
                </div>
            </div>
        )}

        <div className="mt-2 flex justify-end items-center gap-2">
            {canCalibrate && !isCalibrating && (
                 <button
                    type="button"
                    onClick={handleStartCalibration}
                    disabled={isBusy}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in"
                >
                    <CalibrateIcon className="w-4 h-4" />
                    校准证据
                </button>
            )}
            <button
                type="button"
                onClick={handleExtractEvidence}
                disabled={isBusy || !observationText.trim()}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isHighlighting ? <Spinner /> : <SparklesIcon className="w-4 h-4" />}
                提取关键证据
            </button>
        </div>
      </div>

      <div>
        <label htmlFor="knowledge-base" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
            自定义知识库 (可选)
        </label>
        <input
            type="file"
            id="knowledge-base"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.md,.pdf,.docx"
            className="hidden"
            disabled={isBusy}
        />
        {!knowledgeFile ? (
            <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50"
            >
            <FileUploadIcon className="w-5 h-5" />
            上传 .txt, .md, .pdf, 或 .docx 文件
            </button>
        ) : (
            <div className="flex items-center justify-between p-2 pl-4 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg">
                <div className="text-sm overflow-hidden mr-2">
                    <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{knowledgeFile.name}</p>
                     <div className="flex items-center gap-2 mt-1">
                        {fileStatus === 'parsing' && <Spinner />}
                        {fileStatus === 'success' && (
                             <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span className="text-xs font-semibold">知识库已加载，本次分析将优先使用</span>
                            </div>
                        )}
                        {fileStatus === 'error' && <XCircleIcon className="w-4 h-4 text-red-500" />}
                        <p className={`text-xs ${fileStatus === 'error' ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>{fileStatusMessage}</p>
                    </div>
                </div>
                <button type="button" onClick={handleRemoveFile} className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 flex-shrink-0">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
         <div className='flex-shrink-0'>
          <div>
            <label htmlFor="ageGroup" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                年龄段
            </label>
            <select
                id="ageGroup"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
                className="p-2 w-full sm:w-auto bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                disabled={isBusy}
            >
                {Object.values(AgeGroup).map((age) => (
                <option key={age} value={age}>
                    {age}
                </option>
                ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-6 sm:mt-0">
            <button
            type="submit"
            disabled={isBusy || !observationText.trim()}
            className="w-full sm:w-auto px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:dark:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
            >
            {isLoading ? '分析中...' : isParsing ? '文件处理中...' : isHighlighting ? '提取中...' : '开始分析'}
            </button>
        </div>
      </div>
    </form>
  );
};