import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import { HeaderBar } from './HeaderBar';
import { Layers, Plus, Trash2, Edit2, Tag as TagIcon, Check, X, Target } from 'lucide-react';

export const StrategiesView: React.FC = () => {
  const {
    strategies,
    addStrategy,
    updateStrategy,
    deleteStrategy,
    tags,
    addTag,
    deleteTag,
    strategyStats,
  } = useJournal();

  // New Strategy Form State
  const [newStratName, setNewStratName] = useState('');
  const [newStratDesc, setNewStratDesc] = useState('');
  const [newStratCategory, setNewStratCategory] = useState<'Breakout' | 'Reversal' | 'Trend Following' | 'Scalping' | 'Range'>('Trend Following');

  // New Tag State
  const [newTagName, setNewTagName] = useState('');
  const [newTagCategory, setNewTagCategory] = useState<'emotion' | 'market' | 'error' | 'custom'>('market');

  const handleAddStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStratName.trim()) return;
    addStrategy({
      name: newStratName.trim(),
      description: newStratDesc.trim(),
      category: newStratCategory,
    });
    setNewStratName('');
    setNewStratDesc('');
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    const colors = ['#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#F59E0B', '#6366F1'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    addTag({
      name: newTagName.trim(),
      category: newTagCategory,
      color: randomColor,
    });
    setNewTagName('');
  };

  return (
    <div>
      <HeaderBar
        title="Strategies & Tags"
        subtitle="Organize trading setups, playbooks, and emotional execution tags"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategies List & Performance */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-6">
            <h2 className="text-lg font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Trading Playbook Strategies</span>
            </h2>

            <div className="space-y-4">
              {strategies.map((strat) => {
                const stat = strategyStats.find((s) => s.strategyId === strat.id);
                return (
                  <div
                    key={strat.id}
                    className="bg-[#1B1F24] border border-[#292D33] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#F5F5F5]">{strat.name}</span>
                        <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {strat.category}
                        </span>
                      </div>
                      <p className="text-xs text-[#A0A6AE]">{strat.description || 'No detailed playbook notes.'}</p>
                    </div>

                    {/* Stats Pill */}
                    <div className="flex items-center gap-4 bg-[#15181D] px-3 py-2 rounded-lg border border-[#292D33] text-xs">
                      <div>
                        <span className="text-[#6F7680] block text-[10px]">Trades</span>
                        <span className="font-semibold text-[#F5F5F5]">{stat ? stat.tradesCount : 0}</span>
                      </div>
                      <div className="border-l border-[#292D33] pl-3">
                        <span className="text-[#6F7680] block text-[10px]">Win Rate</span>
                        <span className="font-semibold text-emerald-400">{stat ? stat.winRate.toFixed(1) : '0.0'}%</span>
                      </div>
                      <div className="border-l border-[#292D33] pl-3">
                        <span className="text-[#6F7680] block text-[10px]">Net P/L</span>
                        <span className={`font-semibold ${stat && stat.netPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          ${stat ? stat.netPL.toLocaleString() : '0'}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteStrategy(strat.id)}
                        className="text-[#6F7680] hover:text-red-400 ml-2 cursor-pointer transition-colors"
                        title="Delete Strategy"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create Strategy Form */}
          <form onSubmit={handleAddStrategy} className="bg-[#15181D] border border-[#292D33] rounded-xl p-6">
            <h3 className="text-sm font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Create New Strategy</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-[#A0A6AE] block mb-1">Strategy Name</label>
                <input
                  type="text"
                  placeholder="e.g. ICT Silver Bullet"
                  value={newStratName}
                  onChange={(e) => setNewStratName(e.target.value)}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-[#A0A6AE] block mb-1">Category</label>
                <select
                  value={newStratCategory}
                  onChange={(e) => setNewStratCategory(e.target.value as any)}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Breakout">Breakout</option>
                  <option value="Reversal">Reversal</option>
                  <option value="Trend Following">Trend Following</option>
                  <option value="Scalping">Scalping</option>
                  <option value="Range">Range</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-[#A0A6AE] block mb-1">Playbook Description / Rules</label>
              <textarea
                rows={2}
                placeholder="Key confirmation rules, timeframes, risk parameters..."
                value={newStratDesc}
                onChange={(e) => setNewStratDesc(e.target.value)}
                className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Strategy</span>
            </button>
          </form>
        </div>

        {/* Tags Section */}
        <div className="space-y-6">
          <div className="bg-[#15181D] border border-[#292D33] rounded-xl p-6">
            <h2 className="text-lg font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
              <TagIcon className="w-5 h-5 text-emerald-400" />
              <span>Execution & Psychology Tags</span>
            </h2>

            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tg) => (
                <div
                  key={tg.id}
                  className="px-3 py-1.5 rounded-lg border border-[#292D33] bg-[#1B1F24] text-xs flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tg.color || '#10B981' }} />
                  <span className="text-[#F5F5F5] font-medium">{tg.name}</span>
                  <button
                    onClick={() => deleteTag(tg.id)}
                    className="text-[#6F7680] hover:text-red-400 ml-1 cursor-pointer transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddTag} className="space-y-3 pt-4 border-t border-[#292D33]">
              <h3 className="text-xs font-bold text-[#F5F5F5]">Add Custom Tag</h3>
              <div>
                <input
                  type="text"
                  placeholder="Tag name (e.g. FOMO, High Impact News)"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <select
                  value={newTagCategory}
                  onChange={(e) => setNewTagCategory(e.target.value as any)}
                  className="w-full bg-[#1B1F24] border border-[#292D33] text-xs text-[#F5F5F5] rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="market">Market Condition</option>
                  <option value="emotion">Psychology / Emotion</option>
                  <option value="error">Execution Mistake</option>
                  <option value="custom">Custom Tag</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Tag</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
