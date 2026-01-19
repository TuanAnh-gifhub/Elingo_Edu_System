import { FaCoins } from "react-icons/fa";

interface WalletCardProps {
    totalBalance?: number;
    mainAccountBalance?: number;
    onRecharge?: () => void;
    onViewDetails?: () => void;
    isDarkMode?: boolean;
}

const WalletCard = ({
    totalBalance = 0,
    mainAccountBalance = 0,
    onRecharge,
    onViewDetails,
    isDarkMode = false,
}: WalletCardProps) => {
    return (
        <div className="space-y-4">
            {/* Main Account Card - 3D Premium Blue */}
            <div className="group relative">
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4da6ff] via-[#6bb5ff] to-[#4da6ff] rounded-xl opacity-20 group-hover:opacity-40 blur-xl transition-opacity duration-300"></div>

                {/* Main card with 3D effect */}
                <div className="relative bg-gradient-to-br from-[#4da6ff] via-[#3d8fdd] to-[#2d7fcb] rounded-xl p-6 text-white overflow-hidden shadow-2xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(77,166,255,0.4)] border border-white/20">
                    {/* Animated gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>

                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                    {/* Background Pattern - Enhanced */}
                    <div className="absolute top-0 right-0 w-48 h-40 opacity-15">
                        <div className="absolute top-4 right-4 text-5xl font-black text-white/30 drop-shadow-lg tracking-tighter">EduRoom</div>
                    </div>

                    {/* Decorative circles */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>

                    {/* Grid pattern */}
                    <div className="absolute inset-0 opacity-5" style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '20px 20px'
                    }}></div>

                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <p className="text-white/80 text-xs font-semibold mb-2 tracking-wider uppercase">TỔNG TÀI KHOẢN</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-5xl font-black drop-shadow-lg tracking-tight">{totalBalance.toLocaleString('vi-VN')}</span>
                                    <div className="relative">
                                        <FaCoins className="text-yellow-400 text-3xl drop-shadow-lg animate-pulse" />
                                        <div className="absolute inset-0 bg-yellow-400/50 blur-xl"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-black text-white/30 mb-2 drop-shadow-2xl tracking-tight">EduRoom</div>
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg border-2 border-white/30 transform group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-7 h-7 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div className="absolute inset-0 bg-green-400/50 blur-xl rounded-full"></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-end justify-between mt-8 pt-4 border-t border-white/20">
                            <div className="space-y-1">
                                <button className="text-white/70 text-xs hover:text-white transition-colors text-left font-medium hover:underline">
                                    Đồng Tốt là gì?
                                </button>
                                <button className="text-white/70 text-xs hover:text-white transition-colors text-left block font-medium hover:underline">
                                    Thứ tự trừ Đồng Tốt khi thanh toán?
                                </button>
                            </div>
                            <button
                                onClick={onRecharge}
                                className="relative bg-white/25 hover:bg-white/35 backdrop-blur-md px-5 py-2.5 rounded-lg text-white font-bold transition-all duration-300 border border-white/40 shadow-lg hover:shadow-xl hover:scale-105 transform"
                            >
                                <span className="relative z-10">+ Nạp thêm</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 rounded-lg opacity-0 hover:opacity-100 transition-opacity"></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Account Details Card - 3D Enhanced */}
            <div className={`group relative ${isDarkMode ? 'bg-gradient-to-br from-[#2d7fcb] to-[#1e6fb8] border-[#4da6ff]/40' : 'bg-gradient-to-br from-white to-gray-50 border-gray-300'} rounded-xl p-5 border-2 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1`}>
                {/* Glow effect on hover */}
                <div className={`absolute -inset-0.5 ${isDarkMode ? 'bg-gradient-to-r from-[#4da6ff] to-[#6bb5ff]' : 'bg-gradient-to-r from-[#4da6ff] to-[#3d8fdd]'} rounded-xl opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300 -z-10`}></div>

                {/* Inner shine */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#4da6ff]/30' : 'bg-yellow-100'} shadow-lg`}>
                                    <FaCoins className={`${isDarkMode ? 'text-yellow-300' : 'text-yellow-500'} text-xl`} />
                                </div>
                                <div className="absolute inset-0 bg-yellow-400/30 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <span className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Tài khoản chính</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{mainAccountBalance.toLocaleString('vi-VN')}</span>
                            <div className="relative">
                                <FaCoins className={`${isDarkMode ? 'text-yellow-300' : 'text-yellow-500'} text-xl`} />
                                <div className="absolute inset-0 bg-yellow-400/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onViewDetails}
                        className={`text-sm font-semibold hover:underline flex items-center gap-2 group/btn transition-all ${isDarkMode ? 'text-[#6bb5ff] hover:text-[#8cc5ff]' : 'text-[#4da6ff] hover:text-[#3d8fdd]'}`}
                    >
                        <span>Xem chi tiết</span>
                        <svg className="w-4 h-4 transform group-hover/btn:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WalletCard;
