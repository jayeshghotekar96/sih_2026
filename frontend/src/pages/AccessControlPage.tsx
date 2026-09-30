import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import {
  Lock,
  CheckCircle2,
  XCircle,
  Shield,
  ArrowRight,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { contractService } from '../services/contractService';
import { api } from '../services/api';
import { DEMO_ACCOUNTS } from '../components/DemoSwitcher';
import { Role } from '../types';

export const AccessControlPage: React.FC = () => {
  const { provider, signer, account } = useWeb3();

  // Test form state
  const [evalAccount, setEvalAccount] = useState<string>('');
  const [evalResource, setEvalResource] = useState<string>('TACTICAL_HARDWARE');
  const [evalAction, setEvalAction] = useState<string>('CREATE_ASSET');

  // Evaluation Result State
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<{
    evaluated: boolean;
    granted: boolean;
    reason: string;
    evaluatedRole: Role;
    timestamp: string;
  } | null>(null);

  // Initialize with connected account or default demo
  useEffect(() => {
    if (account && !evalAccount) {
      setEvalAccount(account);
    } else if (!evalAccount && DEMO_ACCOUNTS.length > 0) {
      setEvalAccount(DEMO_ACCOUNTS[1].address); // Manager
    }
  }, [account]);

  const handleEvaluate = async (customAcc?: string, customRes?: string, customAct?: string) => {
    const targetAccount = customAcc || evalAccount;
    const targetResource = customRes || evalResource;
    const targetAction = customAct || evalAction;

    if (!provider || !targetAccount) return;

    try {
      setIsEvaluating(true);
      const runner = signer || provider;

      // 1. Fetch role of target account
      const currentRole = await contractService.getRole(targetAccount, runner);

      // 2. Evaluate access on-chain
      const { granted, reason } = await contractService.evaluateAccess(
        targetAccount,
        targetResource,
        targetAction,
        runner
      );

      // 3. Log event in audit ledger
      await api.logAudit({
        category: 'ACCESS',
        action: 'ACCESS_EVALUATED',
        operator: account || targetAccount,
        subject: targetAccount,
        resourceId: targetResource,
        details: `Evaluated ${targetAction} on ${targetResource} -> ${granted ? 'GRANTED' : 'DENIED'} (${reason})`,
        txHash: null,
        success: granted,
      });

      setEvalResult({
        evaluated: true,
        granted,
        reason,
        evaluatedRole: currentRole,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      console.error('Access evaluation failed:', err);
      setEvalResult({
        evaluated: true,
        granted: false,
        reason: err.reason || err.message || 'On-chain access evaluation failed',
        evaluatedRole: 'UNASSIGNED',
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRunPreset = (preset: {
    acc: string;
    res: string;
    act: string;
  }) => {
    setEvalAccount(preset.acc);
    setEvalResource(preset.res);
    setEvalAction(preset.act);
    handleEvaluate(preset.acc, preset.res, preset.act);
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-slate-900">Cryptographic Access Control & Policy Evaluator</h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            On-Chain Policy Engine
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time on-chain permission verification executed directly through DecentraXAccessControl smart contract logic.
        </p>
      </div>

      {/* Interactive Testing Presets for Hackathon Judges */}
      <div className="decentra-card p-5 border-slate-200 bg-slate-50/50">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Hackathon Judge One-Click Test Scenarios
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Click any scenario to instantly trigger on-chain evaluation and view cryptographically verified outcomes:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() =>
              handleRunPreset({
                acc: DEMO_ACCOUNTS[1].address, // Manager
                res: 'TACTICAL_HARDWARE',
                act: 'CREATE_ASSET',
              })
            }
            className="p-3 bg-white border border-slate-200 rounded-md text-left hover:border-blue-400 hover:shadow-subtle transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                Scenario 1
              </span>
              <span className="text-[10px] font-bold text-emerald-600">Expected: ALLOW</span>
            </div>
            <h4 className="text-xs font-semibold text-slate-900 mt-1.5">Manager creates Asset</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Dr. Ananya Roy requests <code className="font-mono">CREATE_ASSET</code>
            </p>
          </button>

          <button
            onClick={() =>
              handleRunPreset({
                acc: DEMO_ACCOUNTS[3].address, // User
                res: 'TACTICAL_HARDWARE',
                act: 'CREATE_ASSET',
              })
            }
            className="p-3 bg-white border border-slate-200 rounded-md text-left hover:border-red-400 hover:shadow-subtle transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Scenario 2
              </span>
              <span className="text-[10px] font-bold text-red-600">Expected: DENY</span>
            </div>
            <h4 className="text-xs font-semibold text-slate-900 mt-1.5">User tries creating Asset</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Sub-Lt. Arjun Nair requests unauthorized mint
            </p>
          </button>

          <button
            onClick={() =>
              handleRunPreset({
                acc: DEMO_ACCOUNTS[2].address, // Auditor
                res: 'AUDIT_JOURNAL',
                act: 'INSPECT_AUDIT_LOGS',
              })
            }
            className="p-3 bg-white border border-slate-200 rounded-md text-left hover:border-purple-400 hover:shadow-subtle transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                Scenario 3
              </span>
              <span className="text-[10px] font-bold text-emerald-600">Expected: ALLOW</span>
            </div>
            <h4 className="text-xs font-semibold text-slate-900 mt-1.5">Auditor inspects Logs</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Inspector Vikramaditya Rao verifies trail
            </p>
          </button>

          <button
            onClick={() =>
              handleRunPreset({
                acc: '0x0000000000000000000000000000000000000099',
                res: 'IDENTITY_DATABASE',
                act: 'VIEW_IDENTITY',
              })
            }
            className="p-3 bg-white border border-slate-200 rounded-md text-left hover:border-red-400 hover:shadow-subtle transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                Scenario 4
              </span>
              <span className="text-[10px] font-bold text-red-600">Expected: DENY</span>
            </div>
            <h4 className="text-xs font-semibold text-slate-900 mt-1.5">Unregistered Attacker</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Rogue wallet attempts privileged action
            </p>
          </button>
        </div>
      </div>

      {/* Interactive Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Form */}
        <div className="decentra-card p-6 border-slate-200">
          <div className="flex items-center space-x-2 mb-4">
            <Lock className="w-4 h-4 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-900">Custom Policy Evaluation Request</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Subject Account (Wallet Address)
              </label>
              <input
                type="text"
                value={evalAccount}
                onChange={(e) => setEvalAccount(e.target.value)}
                placeholder="0x..."
                className="decentra-input font-mono"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {DEMO_ACCOUNTS.map((persona) => (
                  <button
                    key={persona.role}
                    type="button"
                    onClick={() => setEvalAccount(persona.address)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded font-mono text-slate-700 transition-colors"
                  >
                    {persona.role}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Target Resource
              </label>
              <select
                value={evalResource}
                onChange={(e) => setEvalResource(e.target.value)}
                className="decentra-input"
              >
                <option value="TACTICAL_HARDWARE">TACTICAL_HARDWARE (Radar / Transceiver modules)</option>
                <option value="CRYPTO_KEYPAIR">CRYPTO_KEYPAIR (Tactical situational keys)</option>
                <option value="DEFENCE_DOCUMENT">DEFENCE_DOCUMENT (Technical schematics)</option>
                <option value="IDENTITY_DATABASE">IDENTITY_DATABASE (Personnel credentials)</option>
                <option value="AUDIT_JOURNAL">AUDIT_JOURNAL (Immutable security logs)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Requested Action
              </label>
              <select
                value={evalAction}
                onChange={(e) => setEvalAction(e.target.value)}
                className="decentra-input font-mono"
              >
                <option value="CREATE_ASSET">CREATE_ASSET (Manager/Admin)</option>
                <option value="ALLOCATE_ASSET">ALLOCATE_ASSET (Manager/Admin)</option>
                <option value="TRANSFER_ASSET">TRANSFER_ASSET (Manager/Admin)</option>
                <option value="VIEW_ASSET">VIEW_ASSET (Manager/Auditor)</option>
                <option value="VERIFY_IDENTITY">VERIFY_IDENTITY (Auditor/Admin)</option>
                <option value="VERIFY_ASSET">VERIFY_ASSET (Auditor/Admin)</option>
                <option value="INSPECT_AUDIT_LOGS">INSPECT_AUDIT_LOGS (Auditor/Admin)</option>
                <option value="VIEW_ASSIGNED_ASSET">VIEW_ASSIGNED_ASSET (User)</option>
                <option value="VIEW_IDENTITY">VIEW_IDENTITY (User)</option>
                <option value="ASSIGN_ROLE">ASSIGN_ROLE (Admin Only)</option>
                <option value="REVOKE_ROLE">REVOKE_ROLE (Admin Only)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleEvaluate()}
                disabled={isEvaluating || !evalAccount}
                className="decentra-btn-primary w-full flex items-center justify-center space-x-2 py-2.5"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Evaluating Smart Contract Logic...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 text-sky-400" />
                    <span>Evaluate Access via Smart Contract</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Evaluation Output & Justification */}
        <div className="decentra-card p-6 border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Cryptographic Authorization Verdict</h3>
              {evalResult && (
                <span className="text-[10px] font-mono text-slate-400">
                  Evaluated at {evalResult.timestamp}
                </span>
              )}
            </div>

            {!evalResult ? (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center">
                <Cpu className="w-8 h-8 text-slate-300 mb-2" />
                <span>Select an account and action to simulate smart contract access evaluation.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Result Banner */}
                <div
                  className={`p-4 rounded-lg border flex items-start space-x-3 ${
                    evalResult.granted
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  {evalResult.granted ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block">
                      {evalResult.granted ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                    </span>
                    <p className="text-xs font-medium mt-1 leading-snug">{evalResult.reason}</p>
                  </div>
                </div>

                {/* Audit Breakdown Details */}
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Evaluated Account:</span>
                    <span className="font-mono text-slate-800">{evalAccount.substring(0, 10)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Detected RBAC Role:</span>
                    <span className="font-bold text-blue-800">{evalResult.evaluatedRole}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Resource Requested:</span>
                    <span className="font-mono text-slate-800">{evalResource}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Action Requested:</span>
                    <span className="font-mono text-slate-800">{evalAction}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <span className="text-slate-500">Contract Verification:</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> DecentraXAccessControl.sol
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3 mt-4">
            Security note: Authorization decisions occur on the EVM contract layer. In unauthorized attempts, the EVM reverts with custom RBAC error codes.
          </div>
        </div>
      </div>
    </div>
  );
};
