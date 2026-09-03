import { Github, Linkedin, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="md:col-span-1 text-center md:text-left flex flex-col items-center md:items-start">
                        <Link to="/" className="flex items-center gap-2 mb-4 hover:opacity-90 transition-opacity" aria-label="ProjectMatch Home">
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
                        </Link>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto md:mx-0 text-sm leading-relaxed">
                            Connecting students with verified engineering, AI, design, and management opportunities worldwide.
                        </p>
                        <div className="flex gap-4 justify-center md:justify-start">
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Twitter / X profile"
                                className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="LinkedIn page"
                                className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="GitHub repository"
                                className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <Github className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Students */}
                    <div className="text-center md:text-left">
                        <h4 className="font-heading font-semibold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Students</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/projects" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Find Live Projects</Link></li>
                            <li><Link to="/register?type=student" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Join as Student</Link></li>
                            <li><Link to="/completed-projects" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Verified Portfolio</Link></li>
                            <li><a href="/#how-it-works" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">How It Works</a></li>
                        </ul>
                    </div>

                    {/* Recruiters */}
                    <div className="text-center md:text-left">
                        <h4 className="font-heading font-semibold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Recruiters</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/register?type=recruiter" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Post a Project</Link></li>
                            <li><Link to="/login?type=recruiter" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Recruiter Sign In</Link></li>
                            <li><Link to="/dashboard/recruiter" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Candidate Funnel</Link></li>
                            <li><Link to="/projects" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Browse Projects</Link></li>
                        </ul>
                    </div>

                    {/* Legal & Account */}
                    <div className="text-center md:text-left">
                        <h4 className="font-heading font-semibold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Account &amp; Info</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/settings" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Account Settings</Link></li>
                            <li><Link to="/login" className="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Authentication</Link></li>
                            <li><span className="text-slate-400 dark:text-slate-600 text-xs">GDPR &amp; Academic Data Compliant</span></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <p>
                        &copy; {new Date().getFullYear()} ProjectMatch. Built for student development and industry evaluation.
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                        <span>Clean Interface</span>
                        <span>•</span>
                        <span>Accessible</span>
                        <span>•</span>
                        <span>Fast</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
