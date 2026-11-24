'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '@/app/context/ThemeContext';

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="relative w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center transition-colors duration-200 active:scale-[0.97]"
            whileTap={{ scale: 0.96 }}
        >
            <motion.div
                initial={false}
                animate={{
                    rotate: shouldReduceMotion ? 0 : theme === 'dark' ? 0 : 90,
                    scale: theme === 'dark' ? 1 : 0.9,
                    opacity: theme === 'dark' ? 1 : 0,
                    filter: theme === 'dark' ? 'blur(0px)' : 'blur(2px)',
                }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
                className="absolute"
            >
                <FiMoon className="w-5 h-5 text-white" />
            </motion.div>

            <motion.div
                initial={false}
                animate={{
                    rotate: shouldReduceMotion ? 0 : theme === 'light' ? 0 : -90,
                    scale: theme === 'light' ? 1 : 0.9,
                    opacity: theme === 'light' ? 1 : 0,
                    filter: theme === 'light' ? 'blur(0px)' : 'blur(2px)',
                }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
                className="absolute"
            >
                <FiSun className="w-5 h-5 text-gray-800 dark:text-white" />
            </motion.div>
        </motion.button>
    );
}
