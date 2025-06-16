const ExamModal = ({ show, onClose, form, onSubmit, onFormChange, t }) => (
    show && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                <div className="p-5 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">{t('log_new_exam')}</h2>
                </div>
                <form onSubmit={onSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('student_id')}</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={form.student_id}
                            onChange={(e) => onFormChange({ ...form, student_id: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('subject')}</label>
                        <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={form.subject}
                            onChange={(e) => onFormChange({ ...form, subject: e.target.value })}
                            required
                        >
                            <option value="">{t('select_subject')}</option>
                            <option value="Math">{t('Math')}</option>
                            <option value="English">{t('English')}</option>
                            <option value="Hebrew">{t('Hebrew')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('exam_date')}</label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={form.exam_date}
                            onChange={(e) => onFormChange({ ...form, exam_date: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('material')}</label>
                        <textarea
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows="3"
                            value={form.material}
                            onChange={(e) => onFormChange({ ...form, material: e.target.value })}
                        ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            {t('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
); export default ExamModal;