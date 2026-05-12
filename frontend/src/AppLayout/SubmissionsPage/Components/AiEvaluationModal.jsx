import React from 'react';
import Modal from 'react-modal';

const AiEvaluationModal = ({ isOpen, onRequestClose, evaluationResult }) => {
    const customStyles = {
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        content: {
            position: 'relative',
            inset: 'auto',
            width: '90%',
            maxWidth: '500px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            padding: '0',
            borderRadius: '4px',
            color: '#111827',
            overflow: 'hidden'
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onRequestClose={onRequestClose}
            style={customStyles}
            contentLabel="AI Evaluation Result"
            ariaHideApp={false}
        >
            <div className="border-b border-gray-200 p-4 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-toxic shadow-[0_0_8px_#22C55E]"></div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Neural Analysis Report</h2>
                </div>
                <button 
                    onClick={onRequestClose}
                    className="text-gray-600 hover:text-toxic transition-colors text-lg font-mono"
                >
                    [×]
                </button>
            </div>

            <div className="p-6 bg-gray-50">
                {evaluationResult}
            </div>

            <div className="border-t border-gray-200 p-4 bg-white flex justify-end">
                <button 
                    onClick={onRequestClose}
                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600 hover:text-gray-700 transition-colors"
                >
                    Close Terminal
                </button>
            </div>
        </Modal>
    );
};

export default AiEvaluationModal;