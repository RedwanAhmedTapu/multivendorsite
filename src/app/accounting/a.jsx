"use client"
import React, { useState, useEffect } from 'react';
import { Home, Users, DollarSign, FileText, Calculator, Cloud, Settings, LogOut, Plus, Trash2, ChevronDown, ChevronRight, X, Check, Edit } from 'lucide-react';

const AccountingPanel = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [activeUser] = useState('DEVELOPER');
  const [showAccountSubmenu, setShowAccountSubmenu] = useState(false);
  
  // In-memory data storage
  const [accounts, setAccounts] = useState([
    { id: 1, name: 'Ex: Office Rent', type: 'expense', balance: 5000 },
    { id: 2, name: 'Ex: Software Purchase', type: 'expense', balance: 0 },
    { id: 3, name: 'Ex: Internet Bill', type: 'expense', balance: 0 },
    { id: 4, name: 'Ex: Photocopy', type: 'expense', balance: 0 },
    { id: 5, name: 'Ex: Printing Cost', type: 'expense', balance: 0 },
    { id: 6, name: 'Ex: Realized Loss on Share Sale', type: 'expense', balance: 0 },
    { id: 7, name: 'Ex: Bank Charge', type: 'expense', balance: 0 },
    { id: 8, name: 'Ex: Other Expenses', type: 'expense', balance: 0 },
    { id: 9, name: 'Ex: Business Vat', type: 'expense', balance: 0 },
    { id: 10, name: 'Ex: Electricity', type: 'expense', balance: 0 },
    { id: 11, name: 'Ex: Depreciation Charge', type: 'expense', balance: 0 },
    { id: 12, name: 'Ex: GPF PURCHASE', type: 'expense', balance: 0 },
    { id: 13, name: 'Ex: AC Renewal Fees', type: 'expense', balance: 0 },
    { id: 14, name: "Ic: Savings A/C Int", type: 'income', balance: 0 },
    { id: 15, name: "Ic: FDR A/C Int", type: 'income', balance: 0 },
    { id: 16, name: "Ic: Family's Young Star Savings A/C Int", type: 'income', balance: 0 },
    { id: 17, name: "Ic: Car Lac Prc.", type: 'income', balance: 0 },
    { id: 18, name: 'As: Cash at Property', type: 'asset', balance: 0 },
    { id: 19, name: 'As: Car', type: 'asset', balance: 0 },
    { id: 20, name: 'As: BB Bank A/C-0150125', type: 'asset', balance: 0 },
    { id: 21, name: 'As: MBL-1121009477196', type: 'asset', balance: 500 },
    { id: 22, name: 'As: Cash in Hand', type: 'asset', balance: 0 },
  ]);

  const [vouchers, setVouchers] = useState([
    {
      id: 'VN0865',
      date: '2025-12-31',
      creditAccount: 'Ex: Office Rent',
      debitAccount: 'As: MBL-1121009477196',
      amount: 5000,
      remarks: 'Office rent for December',
      status: 'approved'
    }
  ]);

  const [newAccount, setNewAccount] = useState({ name: '', type: 'expense', balance: 0 });
  const [newVoucher, setNewVoucher] = useState({
    creditAccount: '',
    debitAccount: '',
    amount: '',
    remarks: ''
  });

  const [ledgerFilter, setLedgerFilter] = useState({
    account: 'Ex: Office Rent',
    startDate: '2025-01-01',
    endDate: '2025-12-31'
  });

  // Editing state
  const [editingVoucherId, setEditingVoucherId] = useState(null);
  const [editVoucher, setEditVoucher] = useState(null);

  // Calculate account balance from vouchers
  const getAccountBalance = (accountName) => {
    const account = accounts.find(acc => acc.name === accountName);
    let balance = account ? parseFloat(account.balance) : 0;

    vouchers.forEach(voucher => {
      if (voucher.status === 'approved') {
        if (voucher.debitAccount === accountName) {
          balance += parseFloat(voucher.amount);
        }
        if (voucher.creditAccount === accountName) {
          balance -= parseFloat(voucher.amount);
        }
      }
    });
    return balance;
  };

  // Get ledger transactions for an account
  const getLedgerTransactions = () => {
    return vouchers
      .filter(v => {
        const matchAccount = v.creditAccount === ledgerFilter.account || v.debitAccount === ledgerFilter.account;
        const voucherDate = new Date(v.date);
        const startDate = new Date(ledgerFilter.startDate);
        const endDate = new Date(ledgerFilter.endDate);
        return matchAccount && voucherDate >= startDate && voucherDate <= endDate;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Add new account
  const handleAddAccount = () => {
    if (newAccount.name.trim()) {
      setAccounts([...accounts, { 
        id: accounts.length + 1, 
        name: newAccount.name, 
        type: newAccount.type,
        balance: parseFloat(newAccount.balance) || 0
      }]);
      setNewAccount({ name: '', type: 'expense', balance: 0 });
    }
  };

  // Delete account
  const handleDeleteAccount = (id) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      setAccounts(accounts.filter(acc => acc.id !== id));
    }
  };

  // Add voucher entry
  const handleAddVoucher = () => {
    if (newVoucher.creditAccount && newVoucher.debitAccount && newVoucher.amount) {
      // Check if accounts exist
      const creditAccountExists = accounts.find(acc => acc.name === newVoucher.creditAccount);
      const debitAccountExists = accounts.find(acc => acc.name === newVoucher.debitAccount);
      
      if (!creditAccountExists || !debitAccountExists) {
        alert('Please select valid accounts');
        return;
      }

      const voucher = {
        id: `VN${String(vouchers.length + 1).padStart(4, '0')}`,
        date: new Date().toISOString().split('T')[0],
        creditAccount: newVoucher.creditAccount,
        debitAccount: newVoucher.debitAccount,
        amount: parseFloat(newVoucher.amount),
        remarks: newVoucher.remarks,
        status: 'pending'
      };
      setVouchers([...vouchers, voucher]);
      setNewVoucher({ creditAccount: '', debitAccount: '', amount: '', remarks: '' });
      alert('Voucher entry saved successfully!');
    } else {
      alert('Please fill in all required fields');
    }
  };

  // Start editing voucher
  const handleEditVoucher = (voucher) => {
    setEditingVoucherId(voucher.id);
    setEditVoucher({ ...voucher });
  };

  // Save edited voucher
  const handleSaveEditVoucher = () => {
    if (editVoucher.creditAccount && editVoucher.debitAccount && editVoucher.amount) {
      setVouchers(vouchers.map(v => 
        v.id === editingVoucherId ? { ...editVoucher } : v
      ));
      setEditingVoucherId(null);
      setEditVoucher(null);
      alert('Voucher updated successfully!');
    } else {
      alert('Please fill in all required fields');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingVoucherId(null);
    setEditVoucher(null);
  };

  // Approve voucher
  const handleApproveVoucher = (id) => {
    setVouchers(vouchers.map(v => v.id === id ? { ...v, status: 'approved' } : v));
  };

  // Reject voucher
  const handleRejectVoucher = (id) => {
    setVouchers(vouchers.map(v => v.id === id ? { ...v, status: 'rejected' } : v));
  };

  // Delete voucher
  const handleDeleteVoucher = (id) => {
    if (window.confirm('Are you sure you want to delete this voucher?')) {
      setVouchers(vouchers.filter(v => v.id !== id));
    }
  };

  const MenuItem = ({ icon: Icon, label, menuKey, hasSubmenu, onClick }) => (
    <button
      onClick={() => {
        if (hasSubmenu) {
          setShowAccountSubmenu(!showAccountSubmenu);
        } else if (onClick) {
          onClick();
        } else {
          setActiveMenu(menuKey);
          setShowAccountSubmenu(false);
        }
      }}
      className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors text-sm ${
        activeMenu === menuKey ? 'bg-teal-50 border-l-3 border-teal-600 text-teal-700' : 'hover:bg-gray-50 text-gray-700'
      }`}
    >
      <Icon size={18} />
      <span className="font-medium flex-1">{label}</span>
      {hasSubmenu && (showAccountSubmenu ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
    </button>
  );

  const SubMenuItem = ({ label, menuKey }) => (
    <button
      onClick={() => {
        setActiveMenu(menuKey);
      }}
      className={`w-full px-10 py-1.5 text-left text-xs transition-colors ${
        activeMenu === menuKey ? 'bg-teal-100 text-teal-800 font-semibold' : 'hover:bg-gray-100 text-gray-600'
      }`}
    >
      • {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-60 bg-white shadow-sm flex flex-col border-r border-gray-200">
        <div className="p-3 bg-gradient-to-r from-teal-700 to-teal-600 text-white">
          <h2 className="text-lg font-bold">MENU</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          <MenuItem icon={Home} label="Dashboard" menuKey="dashboard" />
          <MenuItem icon={Users} label="Member Panel" menuKey="member" />
          <MenuItem icon={DollarSign} label="Receive Payment" menuKey="payment" />
          <MenuItem icon={FileText} label="M. Ledger/Receipt" menuKey="ledger" />
          <MenuItem icon={Calculator} label="Accounts" menuKey="accounts" hasSubmenu={true} />
          {showAccountSubmenu && (
            <div className="bg-gray-50 border-y border-gray-100">
              <SubMenuItem label="Chart of Accounts" menuKey="chart" />
              <SubMenuItem label="Voucher Entry" menuKey="voucher" />
              <SubMenuItem label="Accounts Ledger" menuKey="ledger-statement" />
              <SubMenuItem label="Declare Collection" menuKey="collection" />
            </div>
          )}
          <MenuItem icon={Cloud} label="Cloud Backup" menuKey="backup" />
          <MenuItem icon={Settings} label="Somiti Settings" menuKey="settings" />
          <MenuItem icon={LogOut} label="Exit" menuKey="exit" onClick={() => alert('Exit clicked')} />
        </div>

        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-xs text-gray-600">Active User:</span>
          </div>
          <div className="bg-teal-600 text-white px-3 py-1.5 rounded flex items-center gap-2">
            <Users size={14} />
            <span className="text-sm">{activeUser}</span>
          </div>
          <div className="mt-3 text-xs text-center text-gray-500">
            <p className="font-semibold">Developed by:</p>
            <p>MD RAYHAN SARDER</p>
            <p>01719615199</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center justify-center w-14 h-14 bg-teal-600 text-white rounded">
                  <Users size={20} />
                  <Users size={18} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-teal-700">Future Savings Foundation</h1>
                  <p className="text-xs text-gray-500">Accounting Management System</p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-600">
                <p className="font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
                <p>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* Dashboard */}
          {activeMenu === 'dashboard' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Dashboard Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-semibold mb-1 opacity-90">Total Assets</h3>
                  <p className="text-2xl font-bold">
                    ৳{accounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + getAccountBalance(a.name), 0).toFixed(2)}
                  </p>
                  <p className="text-xs mt-1 opacity-80">{accounts.filter(a => a.type === 'asset').length} accounts</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-semibold mb-1 opacity-90">Total Income</h3>
                  <p className="text-2xl font-bold">
                    ৳{accounts.filter(a => a.type === 'income').reduce((sum, a) => sum + Math.abs(getAccountBalance(a.name)), 0).toFixed(2)}
                  </p>
                  <p className="text-xs mt-1 opacity-80">{accounts.filter(a => a.type === 'income').length} accounts</p>
                </div>
                <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-semibold mb-1 opacity-90">Total Expenses</h3>
                  <p className="text-2xl font-bold">
                    ৳{accounts.filter(a => a.type === 'expense').reduce((sum, a) => sum + Math.abs(getAccountBalance(a.name)), 0).toFixed(2)}
                  </p>
                  <p className="text-xs mt-1 opacity-80">{accounts.filter(a => a.type === 'expense').length} accounts</p>
                </div>
                <div className="bg-gradient-to-br from-violet-500 to-violet-600 text-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-semibold mb-1 opacity-90">Pending Vouchers</h3>
                  <p className="text-2xl font-bold">
                    {vouchers.filter(v => v.status === 'pending').length}
                  </p>
                  <p className="text-xs mt-1 opacity-80">Awaiting approval</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-6 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Recent Transactions</h3>
                <div className="space-y-2">
                  {vouchers.slice(-5).reverse().map(voucher => (
                    <div key={voucher.id} className="flex justify-between items-center p-2.5 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition">
                      <div>
                        <p className="font-semibold text-sm">{voucher.id}</p>
                        <p className="text-xs text-gray-600">{voucher.creditAccount} → {voucher.debitAccount}</p>
                        <p className="text-xs text-gray-500">{voucher.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-md">৳{voucher.amount.toFixed(2)}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          voucher.status === 'approved' ? 'bg-teal-100 text-teal-800' :
                          voucher.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {voucher.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chart of Accounts */}
          {activeMenu === 'chart' && (
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <h2 className="text-lg font-bold text-teal-700 mb-4 text-center border-b border-teal-200 pb-2">
                Chart of Accounts
              </h2>

              {/* Add New Account Form */}
              <div className="mb-4 p-3 bg-teal-50 rounded border border-teal-200">
                <h3 className="font-semibold mb-2 text-teal-800 text-sm">Add New Account</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Account Name"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                    className="text-sm border border-teal-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <select
                    value={newAccount.type}
                    onChange={(e) => setNewAccount({...newAccount, type: e.target.value})}
                    className="text-sm border border-teal-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="expense">Expense Head</option>
                    <option value="income">Income Head</option>
                    <option value="asset">Asset/Bank Account</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Opening Balance"
                    value={newAccount.balance}
                    onChange={(e) => setNewAccount({...newAccount, balance: e.target.value})}
                    className="text-sm border border-teal-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <button
                    onClick={handleAddAccount}
                    className="bg-teal-600 text-white px-3 py-1.5 rounded hover:bg-teal-700 flex items-center justify-center gap-1 font-semibold text-sm"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>

              {/* Accounts Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Expense Head */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <h3 className="bg-teal-600 text-white px-3 py-2 font-semibold text-center text-sm">Expense Head</h3>
                  <div className="max-h-80 overflow-y-auto">
                    {accounts.filter(a => a.type === 'expense').map(account => (
                      <div key={account.id} className="border-b border-gray-100 p-2 hover:bg-teal-50 flex justify-between items-center group">
                        <div className="flex-1">
                          <span className="text-xs font-medium text-gray-700">{account.name}</span>
                          <p className="text-xs text-gray-500 mt-0.5">Balance: ৳{getAccountBalance(account.name).toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteAccount(account.id)}
                          className="text-rose-600 hover:text-rose-800 opacity-0 group-hover:opacity-100 transition p-1"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Income Head */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <h3 className="bg-blue-600 text-white px-3 py-2 font-semibold text-center text-sm">Income Head</h3>
                  <div className="max-h-80 overflow-y-auto">
                    {accounts.filter(a => a.type === 'income').map(account => (
                      <div key={account.id} className="border-b border-gray-100 p-2 hover:bg-blue-50 flex justify-between items-center group">
                        <div className="flex-1">
                          <span className="text-xs font-medium text-gray-700">{account.name}</span>
                          <p className="text-xs text-gray-500 mt-0.5">Balance: ৳{getAccountBalance(account.name).toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteAccount(account.id)}
                          className="text-rose-600 hover:text-rose-800 opacity-0 group-hover:opacity-100 transition p-1"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Investment/Assets & Bank Accounts */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <h3 className="bg-indigo-600 text-white px-3 py-2 font-semibold text-center text-sm">Investment/Assets & Bank Accounts</h3>
                  <div className="max-h-80 overflow-y-auto">
                    {accounts.filter(a => a.type === 'asset').map(account => (
                      <div key={account.id} className="border-b border-gray-100 p-2 hover:bg-indigo-50 flex justify-between items-center group">
                        <div className="flex-1">
                          <span className="text-xs font-medium text-gray-700">{account.name}</span>
                          <p className="text-xs text-gray-500 mt-0.5">Balance: ৳{getAccountBalance(account.name).toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteAccount(account.id)}
                          className="text-rose-600 hover:text-rose-800 opacity-0 group-hover:opacity-100 transition p-1"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <button className="bg-gray-600 text-white px-4 py-1.5 rounded hover:bg-gray-700 text-sm">
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Voucher Entry */}
          {activeMenu === 'voucher' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="bg-teal-600 text-white p-3 rounded-t-lg">
                <h2 className="text-lg font-bold text-center">Accounts Voucher Entry</h2>
              </div>

              {/* Voucher Entry Form */}
              <div className="p-4">
                <div className="bg-teal-50 rounded-lg p-4 mb-4 border border-teal-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-teal-800 font-semibold mb-1 text-xs">Voucher No :</label>
                      <input
                        type="text"
                        value={`VN${String(vouchers.length + 1).padStart(4, '0')}`}
                        readOnly
                        className="w-full text-sm px-2 py-1.5 border border-teal-300 rounded bg-white text-gray-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-teal-800 font-semibold mb-1 text-xs">Cr. Balance :</label>
                      <input
                        type="text"
                        value={newVoucher.creditAccount ? getAccountBalance(newVoucher.creditAccount).toFixed(2) : '0.00'}
                        readOnly
                        className="w-full text-sm px-2 py-1.5 border border-teal-300 rounded bg-gray-50 text-gray-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-teal-800 font-semibold mb-1 text-xs">Credit Account :</label>
                      <select
                        value={newVoucher.creditAccount}
                        onChange={(e) => setNewVoucher({...newVoucher, creditAccount: e.target.value})}
                        className="w-full text-sm px-2 py-1.5 border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option value="">Select Credit Account</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.name}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-teal-800 font-semibold mb-1 text-xs">Dr. Balance :</label>
                      <input
                        type="text"
                        value={newVoucher.debitAccount ? getAccountBalance(newVoucher.debitAccount).toFixed(2) : '0.00'}
                        readOnly
                        className="w-full text-sm px-2 py-1.5 border border-teal-300 rounded bg-gray-50 text-gray-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-teal-800 font-semibold mb-1 text-xs">Debit Account :</label>
                      <select
                        value={newVoucher.debitAccount}
                        onChange={(e) => setNewVoucher({...newVoucher, debitAccount: e.target.value})}
                        className="w-full text-sm px-2 py-1.5 border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option value="">Select Debit Account</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.name}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-teal-800 font-semibold mb-1 text-xs">Amount :</label>
                      <input
                        type="number"
                        value={newVoucher.amount}
                        onChange={(e) => setNewVoucher({...newVoucher, amount: e.target.value})}
                        className="w-full text-sm px-2 py-1.5 border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-teal-800 font-semibold mb-1 text-xs">Remarks :</label>
                    <textarea
                      value={newVoucher.remarks}
                      onChange={(e) => setNewVoucher({...newVoucher, remarks: e.target.value})}
                      className="w-full text-sm px-2 py-1.5 border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                      rows="2"
                      placeholder="Enter remarks (optional)"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleAddVoucher}
                      className="bg-teal-600 text-white px-4 py-1.5 rounded hover:bg-teal-700 font-semibold text-sm flex items-center gap-1"
                    >
                      <Plus size={14} /> Save Entry
                    </button>
                    <button
                      onClick={() => setNewVoucher({ creditAccount: '', debitAccount: '', amount: '', remarks: '' })}
                      className="bg-gray-600 text-white px-4 py-1.5 rounded hover:bg-gray-700 font-semibold text-sm"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Vouchers List */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-md font-bold text-gray-800">All Vouchers</h3>
                    <span className="text-xs text-gray-500">Total: {vouchers.length}</span>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {vouchers.slice().reverse().map(voucher => (
                      <div key={voucher.id} className="bg-white border border-gray-200 rounded p-3 hover:shadow-sm transition">
                        {editingVoucherId === voucher.id ? (
                          // Edit Mode
                          <div className="space-y-2">
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-bold text-sm text-teal-700">{voucher.id}</p>
                              <p className="text-xs text-gray-500">{voucher.date}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Credit Account</label>
                                <select
                                  value={editVoucher.creditAccount}
                                  onChange={(e) => setEditVoucher({...editVoucher, creditAccount: e.target.value})}
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                                >
                                  {accounts.map(acc => (
                                    <option key={acc.id} value={acc.name}>{acc.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Debit Account</label>
                                <select
                                  value={editVoucher.debitAccount}
                                  onChange={(e) => setEditVoucher({...editVoucher, debitAccount: e.target.value})}
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                                >
                                  {accounts.map(acc => (
                                    <option key={acc.id} value={acc.name}>{acc.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                                <input
                                  type="number"
                                  value={editVoucher.amount}
                                  onChange={(e) => setEditVoucher({...editVoucher, amount: e.target.value})}
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                                <select
                                  value={editVoucher.status}
                                  onChange={(e) => setEditVoucher({...editVoucher, status: e.target.value})}
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="approved">Approved</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                              <textarea
                                value={editVoucher.remarks}
                                onChange={(e) => setEditVoucher({...editVoucher, remarks: e.target.value})}
                                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                                rows="1"
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                onClick={handleSaveEditVoucher}
                                className="bg-teal-600 text-white px-3 py-1 rounded text-xs hover:bg-teal-700 font-semibold flex items-center gap-1"
                              >
                                <Check size={12} /> Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 font-semibold flex items-center gap-1"
                              >
                                <X size={12} /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-sm text-teal-700">{voucher.id}</p>
                                <p className="text-xs text-gray-500">{voucher.date}</p>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  voucher.status === 'approved' ? 'bg-teal-100 text-teal-800' :
                                  voucher.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  {voucher.status}
                                </span>
                              </div>
                              <div className="text-xs space-y-0.5">
                                <p><span className="font-semibold">Credit:</span> {voucher.creditAccount}</p>
                                <p><span className="font-semibold">Debit:</span> {voucher.debitAccount}</p>
                                <p><span className="font-semibold">Amount:</span> ৳{voucher.amount.toFixed(2)}</p>
                                {voucher.remarks && <p className="text-gray-600 italic text-xs">"{voucher.remarks}"</p>}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 ml-3">
                              {voucher.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApproveVoucher(voucher.id)}
                                    className="bg-teal-600 text-white px-2 py-1 rounded text-xs hover:bg-teal-700 font-semibold flex items-center gap-1"
                                  >
                                    <Check size={12} /> Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectVoucher(voucher.id)}
                                    className="bg-rose-600 text-white px-2 py-1 rounded text-xs hover:bg-rose-700 font-semibold flex items-center gap-1"
                                  >
                                    <X size={12} /> Reject
                                  </button>
                                </>
                              )}
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEditVoucher(voucher)}
                                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 font-semibold flex items-center gap-1"
                                >
                                  <Edit size={12} /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteVoucher(voucher.id)}
                                  className="bg-rose-600 text-white px-2 py-1 rounded text-xs hover:bg-rose-700 font-semibold flex items-center gap-1"
                                >
                                  <Trash2 size={12} /> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex justify-center gap-2">
                  <button className="bg-gray-600 text-white px-4 py-1.5 rounded hover:bg-gray-700 font-semibold text-sm">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Accounts Ledger Statement */}
          {activeMenu === 'ledger-statement' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="bg-teal-600 text-white p-3 rounded-t-lg">
                <h2 className="text-lg font-bold text-center">Accounts Ledger Statement</h2>
              </div>

              <div className="p-4">
                {/* Filters */}
                <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700 text-xs">Select an Account</label>
                      <select
                        value={ledgerFilter.account}
                        onChange={(e) => setLedgerFilter({...ledgerFilter, account: e.target.value})}
                        className="w-full text-sm px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                      >
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.name}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700 text-xs">Start Date</label>
                      <input
                        type="date"
                        value={ledgerFilter.startDate}
                        onChange={(e) => setLedgerFilter({...ledgerFilter, startDate: e.target.value})}
                        className="w-full text-sm px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700 text-xs">End Date</label>
                      <input
                        type="date"
                        value={ledgerFilter.endDate}
                        onChange={(e) => setLedgerFilter({...ledgerFilter, endDate: e.target.value})}
                        className="w-full text-sm px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="bg-teal-600 text-white px-3 py-1.5 rounded hover:bg-teal-700 font-semibold text-xs">
                      View Ledger
                    </button>
                    <button 
                      onClick={() => setLedgerFilter({account: accounts[0]?.name || '', startDate: '2025-01-01', endDate: '2025-12-31'})}
                      className="bg-gray-600 text-white px-3 py-1.5 rounded hover:bg-gray-700 font-semibold text-xs"
                    >
                      Clear
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 font-semibold text-xs"
                    >
                      Print Preview
                    </button>
                    <button className="bg-gray-600 text-white px-3 py-1.5 rounded hover:bg-gray-700 font-semibold text-xs">
                      Close
                    </button>
                  </div>
                </div>

                {/* Ledger Table */}
                <div className="overflow-x-auto border border-gray-300 rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-teal-600 text-white">
                        <th className="border border-teal-500 px-2 py-1.5 text-left text-xs">Date</th>
                        <th className="border border-teal-500 px-2 py-1.5 text-left text-xs">Voucher No</th>
                        <th className="border border-teal-500 px-2 py-1.5 text-left text-xs">Particulars</th>
                        <th className="border border-teal-500 px-2 py-1.5 text-right text-xs">Debit</th>
                        <th className="border border-teal-500 px-2 py-1.5 text-right text-xs">Credit</th>
                        <th className="border border-teal-500 px-2 py-1.5 text-right text-xs">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const transactions = getLedgerTransactions();
                        let runningBalance = accounts.find(a => a.name === ledgerFilter.account)?.balance || 0;
                        
                        return (
                          <>
                            <tr className="bg-blue-50 font-semibold">
                              <td colSpan="5" className="border border-gray-300 px-2 py-1.5 text-xs">Opening Balance</td>
                              <td className="border border-gray-300 px-2 py-1.5 text-right text-xs">৳{runningBalance.toFixed(2)}</td>
                            </tr>
                            {transactions.map(txn => {
                              const isDebit = txn.debitAccount === ledgerFilter.account;
                              const isCredit = txn.creditAccount === ledgerFilter.account;
                              
                              if (isDebit) runningBalance += txn.amount;
                              if (isCredit) runningBalance -= txn.amount;

                              return (
                                <tr key={txn.id} className="hover:bg-gray-50">
                                  <td className="border border-gray-300 px-2 py-1.5 text-xs">{txn.date}</td>
                                  <td className="border border-gray-300 px-2 py-1.5 text-xs font-semibold text-teal-700">{txn.id}</td>
                                  <td className="border border-gray-300 px-2 py-1.5 text-xs">
                                    {isDebit ? txn.creditAccount : txn.debitAccount}
                                    {txn.remarks && <p className="text-xs text-gray-500 italic">{txn.remarks}</p>}
                                  </td>
                                  <td className="border border-gray-300 px-2 py-1.5 text-right text-xs">
                                    {isDebit ? `৳${txn.amount.toFixed(2)}` : '-'}
                                  </td>
                                  <td className="border border-gray-300 px-2 py-1.5 text-right text-xs">
                                    {isCredit ? `৳${txn.amount.toFixed(2)}` : '-'}
                                  </td>
                                  <td className="border border-gray-300 px-2 py-1.5 text-right text-xs font-semibold">
                                    ৳{runningBalance.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                            <tr className="bg-teal-50 font-bold">
                              <td colSpan="5" className="border border-gray-300 px-2 py-1.5 text-xs">Closing Balance</td>
                              <td className="border border-gray-300 px-2 py-1.5 text-right text-xs">৳{runningBalance.toFixed(2)}</td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

                {getLedgerTransactions().length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No transactions found for the selected period</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Other Menu Placeholders */}
          {(activeMenu === 'member' || activeMenu === 'payment' || activeMenu === 'ledger' || 
            activeMenu === 'collection' || activeMenu === 'backup' || activeMenu === 'settings') && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
              <div className="text-gray-300 mb-3">
                <Settings size={48} className="mx-auto" />
              </div>
              <h2 className="text-lg font-bold text-gray-700 mb-1">
                {activeMenu === 'member' && 'Member Panel'}
                {activeMenu === 'payment' && 'Receive Payment'}
                {activeMenu === 'ledger' && 'Member Ledger/Receipt'}
                {activeMenu === 'collection' && 'Declare Collection'}
                {activeMenu === 'backup' && 'Cloud Backup'}
                {activeMenu === 'settings' && 'Somiti Settings'}
              </h2>
              <p className="text-gray-500 text-sm">This feature is under development</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountingPanel;