
import React from 'react';

export const Intro: React.FC = () => {
    return (
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">欢迎使用 Ai 助教</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                将您的日常观察转化为专业分析。只需输入观察记录，AI 将自动匹配相关发展目标，提供循证支持，并建议下一步观察方向。
            </p>
        </div>
    );
};