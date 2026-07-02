import React, { useState } from 'react';

const Settings = () => {
  // State for the interactive toggles (to mimic the visual behavior)
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [language, setLanguage] = useState('English');
  const [treeView, setTreeView] = useState('Radial');

  return (
    <div className={`relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden font-display ${darkMode ? 'dark' : ''}`}>
      <div className="flex flex-col w-full">
        <main className="w-full p-4 sm:p-6 lg:p-10">
          <div className="mx-auto max-w-4xl">
            
            {/* Header */}
            <div className="flex flex-wrap justify-between gap-3 pb-8">
              <div className="flex min-w-72 flex-col gap-3">
                <p className="text-[#0d121b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Settings</p>
                <p className="text-[#4c669a] dark:text-gray-400 text-base font-normal leading-normal">Manage your account settings and set app preferences.</p>
              </div>
            </div>

            {/* Account Information Section */}
            <div className="bg-white dark:bg-background-dark/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
              <h2 className="text-[#0d121b] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] px-6 pt-5 pb-3">Account Information</h2>
              <div className="border-t border-gray-200 dark:border-gray-800"></div>
              <div className="p-6">
                <div className="flex flex-col gap-6 @container sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-24 w-24" 
                      data-alt="User profile picture" 
                      style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBIr3AVjbGOszQCIWOG_9SdoslgIOYpmtQw_MjPlpk2f_rSVPrVeDiNXQ5pSzdBNs1WA7Zz6oP5gGUtZcsyNLNH17rU9OEFP04kGxDNlGkyiSLEYnFC88NODXwxgavnicwm8dTOIP2agRnh6NwVOI8DJO4sqt0sUhKU4Z7wWPOZ-W5M2gO32g6aKmgQtU2PMz1Xhe68Cr2KVJG-3XDpMsDFWIwOlHwziIEVPVx75BxdTcXWThb763UUQn-W2IEzcgXOmO6hzTh0mmQD")' }}
                    ></div>
                    <div className="flex flex-col justify-center">
                      <p className="text-[#0d121b] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">Samantha Bee</p>
                      <p className="text-[#4c669a] dark:text-gray-400 text-base font-normal leading-normal">samantha.bee@email.com</p>
                    </div>
                  </div>
                  <div className="flex w-full gap-3 sm:w-auto">
                    <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 dark:bg-gray-800 text-[#0d121b] dark:text-gray-100 text-sm font-bold leading-normal tracking-[0.015em] flex-1 sm:flex-auto hover:bg-gray-200 dark:hover:bg-gray-700">
                      <span className="truncate">Change Photo</span>
                    </button>
                    <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 dark:bg-gray-800 text-[#0d121b] dark:text-gray-100 text-sm font-bold leading-normal tracking-[0.015em] flex-1 sm:flex-auto hover:bg-gray-200 dark:hover:bg-gray-700">
                      <span className="truncate">Edit Name</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Settings Section */}
            <div className="bg-white dark:bg-background-dark/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
              <h2 className="text-[#0d121b] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] px-6 pt-5 pb-3">Security Settings</h2>
              <div className="border-t border-gray-200 dark:border-gray-800"></div>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[#0d121b] dark:text-white font-medium">Password</p>
                    <p className="text-sm text-[#4c669a] dark:text-gray-400">Last changed on Jan 15, 2024</p>
                  </div>
                  <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90">
                    <span className="truncate">Change Password</span>
                  </button>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-800"></div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-[#4c669a] dark:text-gray-500">Add an extra layer of security to your account.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-200 dark:bg-gray-700 dark:text-gray-400 px-2 py-1 rounded-full">Coming Soon</span>
                    {/* Disabled Toggle Switch */}
                    <button 
                      aria-checked="false" 
                      disabled 
                      className="bg-gray-200 dark:bg-gray-700 relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out" 
                      role="switch" 
                      type="button"
                    >
                      <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-500 shadow ring-0 transition duration-200 ease-in-out"></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* App Preferences Section */}
            <div className="bg-white dark:bg-background-dark/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
              <h2 className="text-[#0d121b] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] px-6 pt-5 pb-3">App Preferences</h2>
              <div className="border-t border-gray-200 dark:border-gray-800"></div>
              <div className="p-6 grid gap-6">
                
                {/* Language Select */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[#0d121b] dark:text-white font-medium">Language</p>
                    <p className="text-sm text-[#4c669a] dark:text-gray-400">Choose your preferred language.</p>
                  </div>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-48 rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0d121b] dark:text-white text-sm focus:border-primary focus:ring-primary"
                  >
                    <option>English</option>
                    <option>Español</option>
                    <option>Français</option>
                  </select>
                </div>

                {/* Dark Mode Toggle */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[#0d121b] dark:text-white font-medium">Dark Mode</p>
                    <p className="text-sm text-[#4c669a] dark:text-gray-400">Toggle between light and dark themes.</p>
                  </div>
                  <button 
                    aria-checked={darkMode}
                    onClick={() => setDarkMode(!darkMode)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark ${darkMode ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
                    role="switch" 
                    type="button"
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${darkMode ? 'translate-x-5' : 'translate-x-0'}`}></span>
                  </button>
                </div>

                {/* Tree View Radio Buttons */}
                <div>
                  <p className="text-[#0d121b] dark:text-white font-medium mb-1">Default Tree View</p>
                  <p className="text-sm text-[#4c669a] dark:text-gray-400 mb-3">Select the default layout for your family trees.</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="tree-view" 
                        checked={treeView === 'Radial'}
                        onChange={() => setTreeView('Radial')}
                        className="h-4 w-4 border-gray-300 text-primary focus:ring-primary" 
                      />
                      <span className="text-sm text-[#0d121b] dark:text-gray-300">Radial</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="tree-view" 
                        checked={treeView === 'Vertical'}
                        onChange={() => setTreeView('Vertical')}
                        className="h-4 w-4 border-gray-300 text-primary focus:ring-primary" 
                      />
                      <span className="text-sm text-[#0d121b] dark:text-gray-300">Vertical</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="tree-view" 
                        checked={treeView === 'Horizontal'}
                        onChange={() => setTreeView('Horizontal')}
                        className="h-4 w-4 border-gray-300 text-primary focus:ring-primary" 
                      />
                      <span className="text-sm text-[#0d121b] dark:text-gray-300">Horizontal</span>
                    </label>
                  </div>
                </div>

                {/* Email Notifications Toggle */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[#0d121b] dark:text-white font-medium">Email Notifications</p>
                    <p className="text-sm text-[#4c669a] dark:text-gray-400">Receive updates and alerts via email.</p>
                  </div>
                  <button 
                    aria-checked={emailNotifications}
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark ${emailNotifications ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
                    role="switch" 
                    type="button"
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emailNotifications ? 'translate-x-5' : 'translate-x-0'}`}></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Activity Summary Section */}
            <div className="bg-white dark:bg-background-dark/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
              <h2 className="text-[#0d121b] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] px-6 pt-5 pb-3">Activity Summary</h2>
              <div className="border-t border-gray-200 dark:border-gray-800"></div>
              <div className="p-6 grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <p className="text-sm text-[#4c669a] dark:text-gray-400">Last login</p>
                  <p className="text-[#0d121b] dark:text-white font-medium">July 22, 2024 at 10:30 AM</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm text-[#4c669a] dark:text-gray-400">Account created</p>
                  <p className="text-[#0d121b] dark:text-white font-medium">October 5, 2022</p>
                </div>
                <div className="flex flex-col col-span-full">
                  <p className="text-sm text-[#4c669a] dark:text-gray-400">Connection requests</p>
                  <p className="text-[#0d121b] dark:text-white font-medium">5 Accepted / 2 Rejected / 1 Pending</p>
                </div>
              </div>
            </div>

            {/* Support & Help Section */}
            <div className="bg-white dark:bg-background-dark/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
              <h2 className="text-[#0d121b] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] px-6 pt-5 pb-3">Support & Help</h2>
              <div className="border-t border-gray-200 dark:border-gray-800"></div>
              <div className="p-6 flex flex-col gap-4">
                <p className="text-sm text-[#4c669a] dark:text-gray-400">Need help? Our support team and resources are here for you.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="flex w-full sm:w-auto min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90">
                    <span className="truncate">Contact Support</span>
                  </button>
                  <button className="flex w-full sm:w-auto min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 dark:bg-gray-800 text-[#0d121b] dark:text-gray-100 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-200 dark:hover:bg-gray-700">
                    <span className="truncate">View Help & Documentation</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone Section */}
            <div className="bg-white dark:bg-background-dark/50 rounded-xl shadow-sm border border-red-500/50 dark:border-red-500/30">
              <h2 className="text-red-600 dark:text-red-400 text-xl font-bold leading-tight tracking-[-0.015em] px-6 pt-5 pb-3">Danger Zone</h2>
              <div className="border-t border-red-500/50 dark:border-red-500/30"></div>
              <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-[#0d121b] dark:text-white font-medium">Deactivate Account</p>
                  <p className="text-sm text-[#4c669a] dark:text-gray-400 max-w-md">Once you deactivate your account, there is no going back. Please be certain.</p>
                </div>
                <button className="flex min-w-[84px] w-full sm:w-auto cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-red-600 text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-red-700">
                  <span className="truncate">Deactivate Account</span>
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;