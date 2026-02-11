import React, { useState } from 'react';

const RequestReviewHelpModal = () => {
  // State to manage the active tab
  const [activeRequest, setActiveRequest] = useState('roleChange');
  
  // State to manage the Toast notification
  const [showToast, setShowToast] = useState(false);

  // State to manage text inputs (for character counting)
  const [formValues, setFormValues] = useState({
    roleReason: '',
    addPersonDetails: '',
    incorrectInfo: '',
    correction: '',
    bugDescription: '',
    helpQuestion: ''
  });

  // Handle typing in text areas
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  // Simulate sending the request
  const handleSend = () => {
    setShowToast(true);
    // Hide toast after 3 seconds
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-background-light dark:bg-background-dark font-display text-[#0d121b] dark:text-white">
      <div className="layout-container flex h-full grow flex-col w-full max-w-4xl">
        <div className="layout-content-container flex flex-col flex-1 bg-white dark:bg-[#1C2534] rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          
          {/* Header */}
          <div className="flex flex-wrap justify-between gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-1">
              <p className="text-[#0d121b] dark:text-white tracking-tight text-2xl font-bold">Write to Moderator</p>
              <p className="text-[#4c669a] dark:text-gray-400 text-sm font-normal">Select an action below to get started.</p>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Navigation Grid (Cards) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              
              {/* Card 1: Role Change */}
              <div 
                onClick={() => setActiveRequest('roleChange')}
                className={`flex flex-1 cursor-pointer gap-3 rounded-lg border p-4 flex-col transition-colors duration-200
                  ${activeRequest === 'roleChange' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-[#cfd7e7] dark:border-gray-700 bg-background-light dark:bg-background-dark hover:border-primary/50 dark:hover:border-primary/50'}
                `}
              >
                <span className="material-symbols-outlined text-primary">manage_accounts</span>
                <div className="flex flex-col gap-1">
                  <h2 className="text-[#0d121b] dark:text-white text-base font-bold leading-tight">Role Change Request</h2>
                  <p className="text-[#4c669a] dark:text-gray-400 text-sm font-normal leading-normal">Request a new role</p>
                </div>
              </div>

              {/* Card 2: Edit Confirmation */}
              <div 
                onClick={() => setActiveRequest('editConfirmation')}
                className={`flex flex-1 cursor-pointer gap-3 rounded-lg border p-4 flex-col transition-colors duration-200
                  ${activeRequest === 'editConfirmation' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-[#cfd7e7] dark:border-gray-700 bg-background-light dark:bg-background-dark hover:border-primary/50 dark:hover:border-primary/50'}
                `}
              >
                <span className="material-symbols-outlined text-primary">rule</span>
                <div className="flex flex-col gap-1">
                  <h2 className="text-[#0d121b] dark:text-white text-base font-bold leading-tight">Edit Confirmation Request</h2>
                  <p className="text-[#4c669a] dark:text-gray-400 text-sm font-normal leading-normal">Confirm an edit</p>
                </div>
              </div>

              {/* Card 3: Add Missing Person */}
              <div 
                onClick={() => setActiveRequest('addPerson')}
                className={`flex flex-1 cursor-pointer gap-3 rounded-lg border p-4 flex-col transition-colors duration-200
                  ${activeRequest === 'addPerson' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-[#cfd7e7] dark:border-gray-700 bg-background-light dark:bg-background-dark hover:border-primary/50 dark:hover:border-primary/50'}
                `}
              >
                <span className="material-symbols-outlined text-primary">person_add</span>
                <div className="flex flex-col gap-1">
                  <h2 className="text-[#0d121b] dark:text-white text-base font-bold leading-tight">Add Missing Person / Relationship</h2>
                  <p className="text-[#4c669a] dark:text-gray-400 text-sm font-normal leading-normal">Add a person or relationship</p>
                </div>
              </div>

              {/* Card 4: Report Incorrect */}
              <div 
                onClick={() => setActiveRequest('reportIncorrect')}
                className={`flex flex-1 cursor-pointer gap-3 rounded-lg border p-4 flex-col transition-colors duration-200
                  ${activeRequest === 'reportIncorrect' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-[#cfd7e7] dark:border-gray-700 bg-background-light dark:bg-background-dark hover:border-primary/50 dark:hover:border-primary/50'}
                `}
              >
                <span className="material-symbols-outlined text-primary">report</span>
                <div className="flex flex-col gap-1">
                  <h2 className="text-[#0d121b] dark:text-white text-base font-bold leading-tight">Report Incorrect Information</h2>
                  <p className="text-[#4c669a] dark:text-gray-400 text-sm font-normal leading-normal">Correct an error</p>
                </div>
              </div>

              {/* Card 5: Report Bug */}
              <div 
                 onClick={() => setActiveRequest('reportBug')}
                 className={`flex flex-1 cursor-pointer gap-3 rounded-lg border p-4 flex-col transition-colors duration-200
                  ${activeRequest === 'reportBug' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-[#cfd7e7] dark:border-gray-700 bg-background-light dark:bg-background-dark hover:border-primary/50 dark:hover:border-primary/50'}
                `}
              >
                <span className="material-symbols-outlined text-primary">bug_report</span>
                <div className="flex flex-col gap-1">
                  <h2 className="text-[#0d121b] dark:text-white text-base font-bold leading-tight">Report a Bug / Issue</h2>
                  <p className="text-[#4c669a] dark:text-gray-400 text-sm font-normal leading-normal">Describe a technical issue</p>
                </div>
              </div>

              {/* Card 6: Ask Help */}
              <div 
                onClick={() => setActiveRequest('askHelp')}
                className={`flex flex-1 cursor-pointer gap-3 rounded-lg border p-4 flex-col transition-colors duration-200
                  ${activeRequest === 'askHelp' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-[#cfd7e7] dark:border-gray-700 bg-background-light dark:bg-background-dark hover:border-primary/50 dark:hover:border-primary/50'}
                `}
              >
                <span className="material-symbols-outlined text-primary">help_center</span>
                <div className="flex flex-col gap-1">
                  <h2 className="text-[#0d121b] dark:text-white text-base font-bold leading-tight">Ask for Help</h2>
                  <p className="text-[#4c669a] dark:text-gray-400 text-sm font-normal leading-normal">Get assistance</p>
                </div>
              </div>
            </div>

            {/* Dynamic Content Forms */}
            <div>
              
              {/* Content: Role Change */}
              {activeRequest === 'roleChange' && (
                <div className="space-y-4">
                  <h3 className="text-[#0d121b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pt-4">Role Change Request</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="flex flex-col">
                      <p className="text-[#0d121b] dark:text-gray-300 text-base font-medium leading-normal pb-2">Desired role</p>
                      <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d121b] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfd7e7] dark:border-gray-700 bg-background-light dark:bg-background-dark focus:border-primary/50 h-12 placeholder:text-[#4c669a] dark:placeholder:text-gray-500 p-3 text-base font-normal leading-normal" placeholder="e.g., Contributor, Admin" />
                    </label>
                    <div className="flex flex-col md:col-span-2">
                      <label className="flex flex-col">
                        <div className="flex justify-between items-center pb-2">
                          <p className="text-[#0d121b] dark:text-gray-300 text-base font-medium leading-normal">Reason (optional)</p>
                        </div>
                        <textarea 
                          name="roleReason"
                          maxLength={500} 
                          value={formValues.roleReason}
                          onChange={handleInputChange}
                          className="form-input flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-[#0d121b] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfd7e7] dark:border-gray-700 bg-background-light dark:bg-background-dark focus:border-primary/50 min-h-24 placeholder:text-[#4c669a] dark:placeholder:text-gray-500 p-3 text-base font-normal leading-normal" 
                          placeholder="Please explain why you are requesting this role change..."
                        ></textarea>
                      </label>
                      <div className="flex justify-end pt-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400"><span>{500 - formValues.roleReason.length}</span> characters remaining</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content: Add Person */}
              {activeRequest === 'addPerson' && (
                <div className="space-y-4">
                  <h3 className="text-[#0d121b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pt-4">Add Missing Person / Relationship</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex flex-col">
                      <label className="flex flex-col">
                        <div className="flex justify-between items-center pb-2">
                          <p className="text-[#0d121b] dark:text-gray-300 text-base font-medium leading-normal">Details</p>
                        </div>
                        <textarea 
                          name="addPersonDetails"
                          maxLength={1000} 
                          value={formValues.addPersonDetails}
                          onChange={handleInputChange}
                          className="form-input flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-[#0d121b] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfd7e7] dark:border-gray-700 bg-background-light dark:bg-background-dark focus:border-primary/50 min-h-24 placeholder:text-[#4c669a] dark:placeholder:text-gray-500 p-3 text-base font-normal leading-normal" 
                          placeholder="Please provide details about the person or relationship you'd like to add..."
                        ></textarea>
                      </label>
                      <div className="flex justify-end pt-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400"><span>{1000 - formValues.addPersonDetails.length}</span> characters remaining</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content: Report Incorrect */}
              {activeRequest === 'reportIncorrect' && (
                <div className="space-y-4">
                  <h3 className="text-[#0d121b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pt-4">Report Incorrect Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col md:col-span-1">
                      <label className="flex flex-col">
                        <div className="flex justify-between items-center pb-2">
                          <p className="text-[#0d121b] dark:text-gray-300 text-base font-medium leading-normal">What is incorrect?</p>
                        </div>
                        <textarea 
                          name="incorrectInfo"
                          maxLength={750}
                          value={formValues.incorrectInfo}
                          onChange={handleInputChange}
                          className="form-input flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-[#0d121b] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfd7e7] dark:border-gray-700 bg-background-light dark:bg-background-dark focus:border-primary/50 min-h-24 placeholder:text-[#4c669a] dark:placeholder:text-gray-500 p-3 text-base font-normal leading-normal" 
                          placeholder="e.g., John Doe's birth date..."
                        ></textarea>
                      </label>
                      <div className="flex justify-end pt-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400"><span>{750 - formValues.incorrectInfo.length}</span> characters remaining</p>
                      </div>
                    </div>
                    <div className="flex flex-col md:col-span-1">
                      <label className="flex flex-col">
                        <div className="flex justify-between items-center pb-2">
                          <p className="text-[#0d121b] dark:text-gray-300 text-base font-medium leading-normal">Suggested correction</p>
                        </div>
                        <textarea 
                          name="correction"
                          maxLength={750}
                          value={formValues.correction}
                          onChange={handleInputChange}
                          className="form-input flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-[#0d121b] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfd7e7] dark:border-gray-700 bg-background-light dark:bg-background-dark focus:border-primary/50 min-h-24 placeholder:text-[#4c669a] dark:placeholder:text-gray-500 p-3 text-base font-normal leading-normal" 
                          placeholder="The correct birth date is..."
                        ></textarea>
                      </label>
                      <div className="flex justify-end pt-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400"><span>{750 - formValues.correction.length}</span> characters remaining</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content: Report Bug */}
              {activeRequest === 'reportBug' && (
                <div className="space-y-4">
                  <h3 className="text-[#0d121b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pt-4">Report a Bug / Issue</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex flex-col">
                      <label className="flex flex-col">
                        <div className="flex justify-between items-center pb-2">
                          <p className="text-[#0d121b] dark:text-gray-300 text-base font-medium leading-normal">Issue description</p>
                        </div>
                        <textarea 
                          name="bugDescription"
                          maxLength={1500} 
                          value={formValues.bugDescription}
                          onChange={handleInputChange}
                          className="form-input flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-[#0d121b] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfd7e7] dark:border-gray-700 bg-background-light dark:bg-background-dark focus:border-primary/50 min-h-32 placeholder:text-[#4c669a] dark:placeholder:text-gray-500 p-3 text-base font-normal leading-normal" 
                          placeholder="Please describe the bug or issue in detail. Include steps to reproduce if possible."
                        ></textarea>
                      </label>
                      <div className="flex justify-end pt-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400"><span>{1500 - formValues.bugDescription.length}</span> characters remaining</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content: Ask Help */}
              {activeRequest === 'askHelp' && (
                <div className="space-y-4">
                  <h3 className="text-[#0d121b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pt-4">Ask for Help</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex flex-col">
                      <label className="flex flex-col">
                        <div className="flex justify-between items-center pb-2">
                          <p className="text-[#0d121b] dark:text-gray-300 text-base font-medium leading-normal">Question or topic</p>
                        </div>
                        <textarea 
                          name="helpQuestion"
                          maxLength={1000} 
                          value={formValues.helpQuestion}
                          onChange={handleInputChange}
                          className="form-input flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg text-[#0d121b] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#cfd7e7] dark:border-gray-700 bg-background-light dark:bg-background-dark focus:border-primary/50 min-h-24 placeholder:text-[#4c669a] dark:placeholder:text-gray-500 p-3 text-base font-normal leading-normal" 
                          placeholder="How can we help you?"
                        ></textarea>
                      </label>
                      <div className="flex justify-end pt-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400"><span>{1000 - formValues.helpQuestion.length}</span> characters remaining</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button className="flex items-center justify-center rounded-lg px-6 py-2.5 text-base font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-colors duration-200">Cancel</button>
            <button 
              onClick={handleSend}
              className="flex items-center justify-center rounded-lg px-6 py-2.5 text-base font-semibold bg-primary text-white hover:bg-primary/90 transition-colors duration-200"
            >
              Send Request
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 flex items-center gap-4 rounded-lg bg-green-500/95 p-4 text-white shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="material-symbols-outlined">check_circle</span>
          <p className="text-base font-medium">Your request has been sent to the moderators.</p>
        </div>
      )}
    </div>
  );
};

export default RequestReviewHelpModal;