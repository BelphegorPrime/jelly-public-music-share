import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

export const ThemeIcon: React.FC<{ className?: string }> = ({ className }) => {
    const { theme, toggleTheme } = useTheme();

    const themeText =theme === 'dark' ? 'Light' : 'Dark';
    const themeIcon = theme === 'dark' ? <Sun className={className} /> : <Moon className={className} />;
    return (
        <Button variant='outline' className='rounded-2xl' onClick={toggleTheme}>
            {themeIcon} {themeText}
        </Button>
    )
};