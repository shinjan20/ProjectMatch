import { Github, Linkedin, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="md:col-span-1 text-center md:text-left flex flex-col items-center md:items-start">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 flex items-center justify-center">
                                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                    {/* Left Chevron */}
                                    <path d="M12 16 L4 8 H12 L20 16 L12 24 H4 L12 16 Z" fill="currentColor" className="text-slate-900 dark:text-white" />
                                    {/* Right Chevron */}
                                    <path d="M22 16 L14 8 H22 L30 16 L22 24 H14 L22 16 Z" fill="#4F46E5" />
                                </svg>
                            </div>
                            <span className="font-heading tracking-tight text-slate-900 dark:text-white text-xl">
                                <span className="font-medium">Project</span><span className="font-bold">Match</span>
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto md:mx-0">
                            Bridging the gap between academic learning and real-world industry experience for students worldwide.
                        </p>
                        <div className="flex gap-4 justify-center md:justify-start">
                            <a href="#" className="text-slate-400 hover:text-brand-500 transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-slate-400 hover:text-brand-500 transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-slate-400 hover:text-brand-500 transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="text-center md:text-left">
                        <h4 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Students</h4>
                        <ul className="space-y-3">
                            <li><Link to="/projects" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Find Projects</Link></li>
                            <li><a href="#" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">How it Works</a></li>
                            <li><a href="#" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Success Stories</a></li>
                            <li><a href="#" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Career Advice</a></li>
                        </ul>
                    </div>

                    <div className="text-center md:text-left">
                        <h4 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Companies</h4>
                        <ul className="space-y-3">
                            <li><a href="#" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Post a Project</a></li>
                            <li><a href="#" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Hire Talent</a></li>
                            <li><a href="#" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Partner with Us</a></li>
                            <li><a href="#" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Pricing</a></li>
                        </ul>
                    </div>

                    <div className="text-center md:text-left">
                        <h4 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Legal</h4>
                        <ul className="space-y-3">
                            <li><a href="#" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Cookie Policy</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-sm">
                        &copy; {new Date().getFullYear()} ProjectMatch. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        Made with <span className="text-red-500">♥</span> for students.
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
