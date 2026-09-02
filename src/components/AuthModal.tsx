import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Building2, 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { INITIAL_STUDENTS, INITIAL_STAFF } from '../data/mockData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const { allUsers, setCurrentUser, registerStudent, showToast } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login state
  const [loginEmail, setLoginEmail] = useState<string>('');

  // Register state
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('+266 ');
  const [regStudentId, setRegStudentId] = useState<string>('');
  const [regInstitution, setRegInstitution] = useState<string>('National University of Lesotho (NUL)');
  const [regFaculty, setRegFaculty] = useState<string>('Faculty of Science and Technology');
  const [regYear, setRegYear] = useState<number>(2);
  const [regAddress, setRegAddress] = useState<string>('Roma Campus / Maseru');
  const [regEmergencyName, setRegEmergencyName] = useState<string>('');
  const [regEmergencyPhone, setRegEmergencyPhone] = useState<string>('+266 ');
  const [regPaymentMethod, setRegPaymentMethod] = useState<'mpesa' | 'ecocash' | 'bank_transfer'>('mpesa');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = allUsers.find(
      (u) => u.email.toLowerCase() === loginEmail.toLowerCase().trim()
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      showToast(`Welcome back, ${foundUser.fullName}!`, 'success');
      onSuccess();
      onClose();
    } else {
      showToast('No account found with this email. Try demo accounts below or register.', 'error');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = registerStudent({
      fullName: regFullName,
      email: regEmail,
      phone: regPhone,
      studentIdNumber: regStudentId,
      institution: regInstitution,
      faculty: regFaculty,
      yearOfStudy: regYear,
      residentialAddress: regAddress,
      emergencyContactName: regEmergencyName,
      emergencyContactPhone: regEmergencyPhone,
      preferredRepaymentMethod: regPaymentMethod,
    });

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleQuickDemo = (user: any) => {
    setCurrentUser(user);
    showToast(`Logged in as ${user.fullName} (${user.role.replace('_', ' ')})`, 'success');
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 my-8 animate-in fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white font-black flex items-center justify-center">
              P
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {mode === 'login' ? 'Sign In to POKOLA' : 'Student Loan Registration'}
              </h3>
              <p className="text-xs text-slate-500">Kingdom of Lesotho Student Portal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 rounded-lg transition-all ${
              mode === 'login' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 rounded-lg transition-all ${
              mode === 'register' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New Student Application
          </button>
        </div>

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                Student or Staff Email
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="e.g. keketso.moteane@nul.ls"
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Switcher Section */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant Demo Login (One Click)</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDemo(INITIAL_STUDENTS[0])}
                  className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-900 text-left font-semibold"
                >
                  <p className="font-bold">Keketso Moteane</p>
                  <p className="text-[10px] text-blue-700">NUL Student • Year 2</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo(INITIAL_STUDENTS[1])}
                  className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-900 text-left font-semibold"
                >
                  <p className="font-bold">Tshepo Lerotholi</p>
                  <p className="text-[10px] text-blue-700">LUCT Student • Year 3</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo(INITIAL_STAFF[0])}
                  className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-900 text-left font-semibold"
                >
                  <p className="font-bold">Selloane Mohapi</p>
                  <p className="text-[10px] text-amber-700">Loan Officer</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo(INITIAL_STAFF[1])}
                  className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100 text-purple-900 text-left font-semibold"
                >
                  <p className="font-bold">Dr. Thabo Letsie</p>
                  <p className="text-[10px] text-purple-700">Executive Admin</p>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* REGISTRATION FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs max-h-[460px] overflow-y-auto pr-1">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold uppercase text-slate-700 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Mpho Jane Molapo"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. mpho.molapo@nul.ls"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold uppercase text-slate-700 block mb-1">Lesotho Phone Number</label>
                <input
                  type="text"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+266 5800 0000"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-slate-700 block mb-1">Student ID Number</label>
                <input
                  type="text"
                  value={regStudentId}
                  onChange={(e) => setRegStudentId(e.target.value.toUpperCase())}
                  placeholder="e.g. NUL/2023/8921"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Higher Education Institution</label>
              <select
                value={regInstitution}
                onChange={(e) => setRegInstitution(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                <option value="National University of Lesotho (NUL)">National University of Lesotho (NUL)</option>
                <option value="Limkokwing University of Creative Technology (LUCT)">Limkokwing University of Creative Technology (LUCT)</option>
                <option value="Lerotholi Polytechnic (LP)">Lerotholi Polytechnic (Fokothi)</option>
                <option value="Botho University Lesotho">Botho University Lesotho</option>
                <option value="Centre for Accounting Studies (CAS)">Centre for Accounting Studies (CAS)</option>
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold uppercase text-slate-700 block mb-1">Faculty / Department</label>
                <input
                  type="text"
                  value={regFaculty}
                  onChange={(e) => setRegFaculty(e.target.value)}
                  placeholder="e.g. Faculty of Health Sciences"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-slate-700 block mb-1">Year of Study</label>
                <select
                  value={regYear}
                  onChange={(e) => setRegYear(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value={1}>Year 1 (Freshman)</option>
                  <option value={2}>Year 2</option>
                  <option value={3}>Year 3</option>
                  <option value={4}>Year 4</option>
                  <option value={5}>Year 5 (Honours / Medical)</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold uppercase text-slate-700 block mb-1">Emergency Contact Name</label>
                <input
                  type="text"
                  value={regEmergencyName}
                  onChange={(e) => setRegEmergencyName(e.target.value)}
                  placeholder="e.g. Lineo Molapo (Mother)"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-slate-700 block mb-1">Emergency Contact Phone</label>
                <input
                  type="text"
                  value={regEmergencyPhone}
                  onChange={(e) => setRegEmergencyPhone(e.target.value)}
                  placeholder="+266 5900 0000"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-bold uppercase text-slate-700 block mb-1">Disbursement & Repayment Channel</label>
              <select
                value={regPaymentMethod}
                onChange={(e) => setRegPaymentMethod(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                <option value="mpesa">Vodacom M-Pesa</option>
                <option value="ecocash">Econet EcoCash</option>
                <option value="bank_transfer">Commercial Bank EFT</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md uppercase tracking-wider"
              >
                Complete Registration & Check Eligibility
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
