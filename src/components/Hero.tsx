import { Link } from 'react-router-dom';
import { HERO_COMPANIES, HERO_STATS } from '../constants';

const Hero = () => {
    return (
        <div className="relative min-h-[95vh] w-full max-w-[100vw] flex flex-col justify-center pt-20 pb-12 overflow-hidden bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-300">
            {/* Clean, Flat Background */}
            <div className="absolute inset-0 pointer-events-none z-0 w-full h-full" />

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-8 sm:pt-16 flex flex-col items-center justify-center">
                <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center justify-center">

                    {/* Simple Professional Badge */}
                    <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm mb-6 border border-slate-200 dark:border-slate-700">
                        <span>New live projects added weekly</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 sm:mb-8 leading-tight max-w-4xl">
                        Build your <span className="text-brand-600 dark:text-brand-400">Edge</span> with Remote Experience
                    </h1>

                    <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 sm:mb-12 max-w-2xl mx-auto font-medium px-2 sm:px-0 leading-relaxed">
                        Connect with top teams globally. Work on remote engineering and management projects. <br className="hidden sm:block" />
                        <span className="text-slate-800 dark:text-slate-200 inline-block mt-2">Gain real-world experience before graduating.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                        <Link 
                            to="/register?type=student" 
                            className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white font-semibold text-base py-3 px-8 rounded-xl text-center shadow-md transition-colors"
                        >
                            Join as a Student
                        </Link>
                        <Link 
                            to="/register?type=recruiter" 
                            className="w-full sm:w-auto bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-base py-3 px-8 rounded-xl text-center border border-slate-200 dark:border-slate-700 transition-colors"
                        >
                            Hire Talent
                        </Link>
                    </div>
                </div>

                <div className="mt-16 sm:mt-24 w-full max-w-[100vw] sm:max-w-7xl mx-auto">
                    <p className="text-center text-xs font-bold text-slate-500 tracking-[0.2em] uppercase mb-8 opacity-80">
                        Collaborating organizations
                    </p>

                    {/* Static Credibility List */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl py-6 px-8 border border-slate-200 dark:border-slate-800 shadow-sm w-full">
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6 items-center justify-items-center">
                            {HERO_COMPANIES.slice(0, 6).map((company, index) => (
                                <div key={index} className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                                    <company.icon className="w-5 h-5" />
                                    <span className="text-base font-bold">{company.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Flat Stats Grid */}
                <div className="mt-16 border-t border-slate-200 dark:border-slate-800 pt-8 grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                    {HERO_STATS.map((stat, i) => (
                        <div key={i} className="flex flex-col items-center text-center">
                            <div className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                                {stat.count}
                            </div>
                            <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm mt-1">{stat.label}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.sub}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Hero;
