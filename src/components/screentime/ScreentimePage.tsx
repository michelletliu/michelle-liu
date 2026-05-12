"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from '@/lib/navigation';
const loadDomToPng = () => import('modern-screenshot').then(m => m.domToPng);
import imgLogo from '../../assets/logo.png';
import InfoButton from '../InfoButton';
import { useExperimentProject } from '../../hooks/useExperimentProject';


// Default project info (fallback if Sanity fetch fails)
const DEFAULT_SCREENTIME_PROJECT = {
  id: 'screentime',
  title: 'Screentime Receipt',
  year: '2025',
  description: 'A receipt for your daily or weekly screentime.',
  imageSrc: 'https://image.mux.com/AdZWDHKkfyhXntZy01keNYtPB7Q6w8GxeaUWmP8501SLI/thumbnail.png',
  videoSrc: 'https://stream.mux.com/AdZWDHKkfyhXntZy01keNYtPB7Q6w8GxeaUWmP8501SLI.m3u8',
  xLink: 'https://x.com/michelletliu/status/2000987498550383032',
  tryItOutHref: '/screentime',
  backgroundColor: '#f3f4f6',
  toolCategories: [
    { label: 'Design', tools: ['Figma'] },
    { label: 'Frontend', tools: ['TypeScript', 'React', 'Vite'] },
    { label: 'Styling', tools: ['Tailwind CSS'] },
    { label: 'AI', tools: ['Figma Make', 'Cursor'] },
  ],
};

// Import SVG icons
import phoneIconSvg from '../../assets/receipt/Screen Time Receipt/src/assets/􀟜.svg';
import saveIconSvg from '../../assets/receipt/Screen Time Receipt/src/assets/save.svg';
import sendIconSvg from '../../assets/receipt/Screen Time Receipt/src/assets/send.svg';
import savedCheckSvg from './saved.svg';
import uploadIconSvg from '../../assets/Upload.svg';

// Import app icons - optimized versions (132x132, ~30-40KB each instead of 4-9MB)
import imgInstagramIcon from '../../assets/receipt/icons-optimized/fcadb86f9e7ac3194098e501064eb43213cdfff1.png';
import imgTwitterIcon from '../../assets/receipt/icons-optimized/IMG_6929.png';
import imgLinkedInIcon from '../../assets/receipt/icons-optimized/IMG_6930.png';
import imgMessagesIcon from '../../assets/receipt/icons-optimized/dd3b1a5ed7db644c197314328f647774bd86226e.png';
import imgCalendarIcon from '../../assets/receipt/icons-optimized/IMG_6926.png';
import imgSlackIcon from '../../assets/receipt/icons-optimized/IMG_6919.png';
import imgNotesIcon from '../../assets/receipt/icons-optimized/a96b215a3998f46bd64e605040650bcf6eeedb40.png';
import imgMailIcon from '../../assets/receipt/icons-optimized/IMG_6921.png';
import imgNotionIcon from '../../assets/receipt/icons-optimized/IMG_6925.png';
import imgYoutubeIcon from '../../assets/receipt/icons-optimized/IMG_6932.png';
import imgNetflixIcon from '../../assets/receipt/icons-optimized/IMG_6933 1.png';
import imgSpotifyIcon from '../../assets/receipt/icons-optimized/IMG_6931.png';

const APP_ICONS = {
  instagram: imgInstagramIcon,
  twitter: imgTwitterIcon,
  linkedin: imgLinkedInIcon,
  messages: imgMessagesIcon,
  calendar: imgCalendarIcon,
  slack: imgSlackIcon,
  notes: imgNotesIcon,
  mail: imgMailIcon,
  notion: imgNotionIcon,
  youtube: imgYoutubeIcon,
  netflix: imgNetflixIcon,
  spotify: imgSpotifyIcon,
};

// SVG paths for status bar icons
const svgPaths = {
  cellular: "M19.2 1.14623C19.2 0.513183 18.7224 0 18.1333 0H17.0667C16.4776 0 16 0.513183 16 1.14623V11.0802C16 11.7132 16.4776 12.2264 17.0667 12.2264H18.1333C18.7224 12.2264 19.2 11.7132 19.2 11.0802V1.14623ZM11.7659 2.44528H12.8326C13.4217 2.44528 13.8992 2.97078 13.8992 3.61902V11.0527C13.8992 11.7009 13.4217 12.2264 12.8326 12.2264H11.7659C11.1768 12.2264 10.6992 11.7009 10.6992 11.0527V3.61902C10.6992 2.97078 11.1768 2.44528 11.7659 2.44528ZM7.43411 5.09433H6.36745C5.77834 5.09433 5.30078 5.62652 5.30078 6.28301V11.0377C5.30078 11.6942 5.77834 12.2264 6.36745 12.2264H7.43411C8.02322 12.2264 8.50078 11.6942 8.50078 11.0377V6.28301C8.50078 5.62652 8.02322 5.09433 7.43411 5.09433ZM2.13333 7.53962H1.06667C0.477563 7.53962 0 8.06421 0 8.71132V11.0547C0 11.7018 0.477563 12.2264 1.06667 12.2264H2.13333C2.72244 12.2264 3.2 11.7018 3.2 11.0547V8.71132C3.2 8.06421 2.72244 7.53962 2.13333 7.53962Z",
  wifi: "M8.5713 2.46628C11.0584 2.46639 13.4504 3.38847 15.2529 5.04195C15.3887 5.1696 15.6056 5.16799 15.7393 5.03834L17.0368 3.77487C17.1045 3.70911 17.1422 3.62004 17.1417 3.52735C17.1411 3.43467 17.1023 3.34603 17.0338 3.28104C12.3028 -1.09368 4.83907 -1.09368 0.108056 3.28104C0.039524 3.34598 0.000639766 3.4346 7.82398e-06 3.52728C-0.000624118 3.61996 0.0370483 3.70906 0.104689 3.77487L1.40255 5.03834C1.53615 5.16819 1.75327 5.1698 1.88893 5.04195C3.69167 3.38836 6.08395 2.46628 8.5713 2.46628ZM8.56795 6.68656C9.92527 6.68647 11.2341 7.19821 12.2403 8.12234C12.3763 8.2535 12.5907 8.25065 12.7234 8.11593L14.0106 6.79663C14.0784 6.72742 14.1161 6.63355 14.1151 6.53599C14.1141 6.43844 14.0746 6.34536 14.0054 6.27757C10.9416 3.38672 6.19688 3.38672 3.13305 6.27757C3.06384 6.34536 3.02435 6.43849 3.02345 6.53607C3.02254 6.63365 3.06028 6.72752 3.12822 6.79663L4.41513 8.11593C4.54778 8.25065 4.76215 8.2535 4.89823 8.12234C5.90368 7.19882 7.21152 6.68713 8.56795 6.68656ZM11.0924 9.48011C11.0943 9.58546 11.0572 9.68703 10.9899 9.76084L8.81327 12.2156C8.74946 12.2877 8.66247 12.3283 8.5717 12.3283C8.48093 12.3283 8.39394 12.2877 8.33013 12.2156L6.1531 9.76084C6.08585 9.68697 6.04886 9.58537 6.05085 9.48002C6.05284 9.37467 6.09365 9.27491 6.16364 9.20429C7.55374 7.8904 9.58966 7.8904 10.9798 9.20429C11.0497 9.27497 11.0904 9.37476 11.0924 9.48011Z",
  batteryCap: "M26 4.78113V8.8566C26.8047 8.51143 27.328 7.70847 27.328 6.81886C27.328 5.92926 26.8047 5.1263 26 4.78113",
};

type Screen = 'generate' | 'receipt' | 'share' | 'upload';

type AppUsage = {
  name: string;
  category: string;
  minutes: number;
  icon: string;
};

// Cache for fetched app icons
const appIconCache: Record<string, string> = {};

// Fetch app icon from iTunes Search API
async function fetchAppIcon(appName: string): Promise<string | null> {
  // Check cache first
  if (appIconCache[appName]) {
    return appIconCache[appName];
  }

  try {
    const searchTerm = encodeURIComponent(appName);
    const response = await fetch(
      `https://itunes.apple.com/search?term=${searchTerm}&entity=software&limit=1`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Get the highest resolution icon (512x512)
      let iconUrl = data.results[0].artworkUrl512 || 
                    data.results[0].artworkUrl100 || 
                    data.results[0].artworkUrl60;
      
      // Cache it
      appIconCache[appName] = iconUrl;
      console.log(`✓ Found icon for ${appName}: ${iconUrl}`);
      return iconUrl;
    }
    
    console.warn(`⚠️ No icon found for ${appName}`);
    return null;
  } catch (error) {
    console.error(`Error fetching icon for ${appName}:`, error);
    return null;
  }
}

type ReceiptData = {
  period: 'daily' | 'weekly';
  startDate: string;
  endDate: string;
  generatedTime: string;
  categories: {
    name: string;
    apps: AppUsage[];
  }[];
};

function generateRandomMinutes(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}m`;
  }
  return `${hours}h ${mins}m`;
}

const CATEGORY_SOCIAL = new Set(['instagram', 'twitter', 'x', 'tiktok', 'facebook', 'reddit', 'linkedin', 'hinge', 'bumble', 'tinder', 'beli']);
const CATEGORY_COMM = new Set(['messages', 'imessage', 'messenger', 'whatsapp', 'discord']);
const CATEGORY_WORK = new Set(['slack', 'notion', 'calendar', 'mail', 'gmail', 'outlook', 'notes']);
const CATEGORY_ENTERTAINMENT = new Set(['youtube', 'netflix', 'spotify']);
const CATEGORY_BROWSER = new Set(['safari', 'chrome']);

function getCategoryForApp(appKey: string): string {
  if (CATEGORY_SOCIAL.has(appKey)) return 'SOCIAL MEDIA';
  if (CATEGORY_COMM.has(appKey)) return 'COMMUNICATION';
  if (CATEGORY_WORK.has(appKey)) return 'PRODUCTIVITY';
  if (CATEGORY_ENTERTAINMENT.has(appKey)) return 'ENTERTAINMENT';
  if (CATEGORY_BROWSER.has(appKey)) return 'WEB BROWSING';
  return 'APP';
}

// Parse OCR text from Screen Time screenshot
async function parseScreenTimeOCR(ocrText: string): Promise<Partial<ReceiptData> | null> {
  try {
    console.log('=== OCR RAW TEXT ===');
    console.log(ocrText);
    console.log('===================');
    
    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line);
    
    // Find the "Most Used" section - only parse data after this line
    let mostUsedIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase().replace(/\s+/g, '');
      // More flexible matching - remove all spaces and check
      if (lineLower.includes('mostused') || lineLower.includes('most') && lines[i].toLowerCase().includes('used')) {
        mostUsedIndex = i;
        console.log(`✓ Found "Most Used" section at line ${i}: "${lines[i]}"`);
        break;
      }
    }
    
    if (mostUsedIndex === -1) {
      console.warn('⚠️ Could not find "Most Used" section, will parse all lines...');
      // If we can't find "Most Used", start from beginning
      mostUsedIndex = -1; // Will process all lines from start
    }
    
    // Only process lines after "Most Used" (or all lines if not found)
    const relevantLines = mostUsedIndex === -1 ? lines : lines.slice(mostUsedIndex + 1);
    
    console.log('=== PROCESSING LINES ===');
    console.log(`Total lines to process: ${relevantLines.length}`);
    console.log('First 10 lines:', relevantLines.slice(0, 10));
    
    // Map known app names to our icon keys (case-insensitive)
    const appNameMap: Record<string, { key: string; displayName: string; emoji?: string }> = {
      'instagram': { key: 'instagram', displayName: 'INSTAGRAM' },
      'twitter': { key: 'twitter', displayName: 'TWITTER/X' },
      'x': { key: 'twitter', displayName: 'X' },
      'linkedin': { key: 'linkedin', displayName: 'LINKEDIN' },
      'messages': { key: 'messages', displayName: 'MESSAGES' },
      'imessage': { key: 'messages', displayName: 'MESSAGES' },
      'calendar': { key: 'calendar', displayName: 'CALENDAR' },
      'slack': { key: 'slack', displayName: 'SLACK' },
      'notes': { key: 'notes', displayName: 'NOTES' },
      'mail': { key: 'mail', displayName: 'MAIL' },
      'notion': { key: 'notion', displayName: 'NOTION' },
      'youtube': { key: 'youtube', displayName: 'YOUTUBE' },
      'netflix': { key: 'netflix', displayName: 'NETFLIX' },
      'spotify': { key: 'spotify', displayName: 'SPOTIFY' },
      'safari': { key: 'instagram', displayName: 'SAFARI' },
      'chrome': { key: 'instagram', displayName: 'CHROME' },
      'facebook': { key: 'instagram', displayName: 'FACEBOOK' },
      'messenger': { key: 'messages', displayName: 'MESSENGER' },
      'whatsapp': { key: 'messages', displayName: 'WHATSAPP' },
      'tiktok': { key: 'instagram', displayName: 'TIKTOK' },
      'reddit': { key: 'twitter', displayName: 'REDDIT' },
      'discord': { key: 'slack', displayName: 'DISCORD' },
      'gmail': { key: 'mail', displayName: 'GMAIL' },
      'outlook': { key: 'mail', displayName: 'OUTLOOK' },
      'beli': { key: 'instagram', displayName: 'BELI' },
      'retro': { key: 'instagram', displayName: 'RETRO' },
      'hinge': { key: 'instagram', displayName: 'HINGE' },
      'bumble': { key: 'instagram', displayName: 'BUMBLE' },
      'tinder': { key: 'instagram', displayName: 'TINDER' },
    };

    type PendingApp = {
      name: string;
      category: string;
      minutes: number;
      iconKey: string;
      appKey: string;
      needsFetch: boolean;
    };

    const pendingApps: PendingApp[] = [];
    const seenNames = new Set<string>();
    
    console.log('=== STARTING LINE-BY-LINE PARSING ===');
    
    for (let i = 0; i < relevantLines.length; i++) {
      const line = relevantLines[i];
      const nextLine = relevantLines[i + 1] || '';
      const prevLine = relevantLines[i - 1] || '';
      
      console.log(`Processing line ${i}: "${line}"`);
      
      if (line.toLowerCase().includes('pickup') || 
          line.toLowerCase().includes('show more') ||
          line.toLowerCase().includes('daily average')) {
        console.log(`✓ Stopped parsing at section: ${line}`);
        break;
      }
      
      if (line.toLowerCase().includes('show categories') || 
          line.toLowerCase().includes('categories') ||
          line.toLowerCase().includes('subtotal')) {
        console.log(`  Skipping: ${line}`);
        continue;
      }
      
      const lineLower = line.toLowerCase();
      const nextLineLower = nextLine.toLowerCase();
      
      let timeMatch = lineLower.match(/(\d+)\s*(?:h|hr)(?:r|our)?\s*(\d+)\s*(?:m|min)/i) || 
                      lineLower.match(/(\d+)\s*(?:h|hr)(?:r|our)?(?!\d)/i) ||
                      lineLower.match(/(\d+)\s*(?:m|min)(?:ute)?(?:s)?(?!\d)/i);
      let timeInNextLine = false;
      
      if (!timeMatch) {
        timeMatch = nextLineLower.match(/(\d+)\s*(?:h|hr)(?:r|our)?\s*(\d+)\s*(?:m|min)/i) || 
                    nextLineLower.match(/(\d+)\s*(?:h|hr)(?:r|our)?(?!\d)/i) ||
                    nextLineLower.match(/(\d+)\s*(?:m|min)(?:ute)?(?:s)?(?!\d)/i);
        timeInNextLine = true;
      }
      
      if (timeMatch) {
        console.log(`  Found time: ${timeMatch[0]} (in ${timeInNextLine ? 'next' : 'current'} line)`);
        
        let totalMinutes = 0;
        
        if (timeMatch[1] && timeMatch[2]) {
          totalMinutes = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
        } else if (timeMatch[3]) {
          totalMinutes = parseInt(timeMatch[3]) * 60;
        } else if (timeMatch[4]) {
          totalMinutes = parseInt(timeMatch[4]);
        }
        
        console.log(`  Parsed time: ${totalMinutes} minutes`);
        
        if (totalMinutes > 0) {
          const searchLine = timeInNextLine ? lineLower : prevLine.toLowerCase();
          console.log(`  Searching for app name in: "${timeInNextLine ? line : prevLine}"`);
          
          let foundApp = false;
          
          for (const [key, value] of Object.entries(appNameMap)) {
            if (searchLine.includes(key) && !seenNames.has(value.displayName)) {
              seenNames.add(value.displayName);
              const hasLocalIcon = APP_ICONS[value.key as keyof typeof APP_ICONS];
              const needsFetch = !hasLocalIcon || (value.key === 'instagram' && !['instagram', 'facebook', 'tiktok'].includes(key));
              
              pendingApps.push({
                name: value.displayName,
                category: getCategoryForApp(key),
                minutes: totalMinutes,
                iconKey: value.key,
                appKey: key,
                needsFetch,
              });
              console.log(`  ✓ Parsed: ${value.displayName} - ${totalMinutes}m`);
              foundApp = true;
              break;
            }
          }
          
          if (!foundApp) {
            console.log(`  ✗ No matching app found for "${timeInNextLine ? line : prevLine}"`);
          }
        }
      } else {
        const numbersInLine = lineLower.match(/\d+/g);
        if (numbersInLine && numbersInLine.length >= 1) {
          if (lineLower.includes('h') || lineLower.includes('m') || 
              nextLineLower.includes('h') || nextLineLower.includes('m')) {
            console.log(`  Found numbers ${numbersInLine} with h/m indicators nearby`);
          }
        }
        
        for (const [key, value] of Object.entries(appNameMap)) {
          if (lineLower.includes(key) && !seenNames.has(value.displayName)) {
            seenNames.add(value.displayName);
            let defaultMinutes = 60;
            
            if (['instagram', 'x', 'twitter', 'tiktok', 'youtube', 'netflix', 'spotify'].includes(key)) {
              defaultMinutes = Math.floor(Math.random() * 180) + 120;
            } else if (['messages', 'linkedin', 'slack', 'mail', 'notion'].includes(key)) {
              defaultMinutes = Math.floor(Math.random() * 120) + 60;
            } else {
              defaultMinutes = Math.floor(Math.random() * 60) + 30;
            }
            
            const hasLocalIcon = APP_ICONS[value.key as keyof typeof APP_ICONS];
            const needsFetch = !hasLocalIcon || (value.key === 'instagram' && !['instagram', 'facebook', 'tiktok'].includes(key));
            
            pendingApps.push({
              name: value.displayName,
              category: getCategoryForApp(key),
              minutes: defaultMinutes,
              iconKey: value.key,
              appKey: key,
              needsFetch,
            });
            console.log(`  ✓ Parsed: ${value.displayName} - ${defaultMinutes}m (estimated - OCR couldn't read time)`);
            break;
          }
        }
      }
    }

    // Fetch all missing icons in parallel instead of sequentially
    const iconFetchPromises = pendingApps
      .filter(app => app.needsFetch)
      .map(app => fetchAppIcon(app.name).then(icon => ({ name: app.name, icon })));
    
    const fetchedIcons = await Promise.all(iconFetchPromises);
    const iconMap = new Map(fetchedIcons.map(r => [r.name, r.icon]));

    const parsedApps: AppUsage[] = pendingApps.map(app => ({
      name: app.name,
      category: app.category,
      minutes: app.minutes,
      icon: app.needsFetch
        ? (iconMap.get(app.name) || APP_ICONS.instagram)
        : APP_ICONS[app.iconKey as keyof typeof APP_ICONS],
    }));
    
    // If we found some apps, organize them into categories
    if (parsedApps.length > 0) {
      console.log(`✅ Successfully parsed ${parsedApps.length} apps from screenshot`);
      console.log('Parsed apps:', parsedApps.map(a => `${a.name} (${a.minutes}m)`).join(', '));
      
      const socialNames = new Set(['INSTAGRAM', 'X', 'TWITTER/X', 'LINKEDIN', 'FACEBOOK', 'TIKTOK', 'REDDIT', 'HINGE', 'BELI']);
      const commNames = new Set(['MESSAGES', 'MESSENGER', 'WHATSAPP', 'DISCORD']);
      const workNames = new Set(['SLACK', 'NOTION', 'CALENDAR', 'MAIL', 'GMAIL', 'OUTLOOK', 'NOTES']);
      const entertainmentNames = new Set(['YOUTUBE', 'NETFLIX', 'SPOTIFY']);
      const browserNames = new Set(['SAFARI', 'CHROME']);

      const socialApps: AppUsage[] = [];
      const commApps: AppUsage[] = [];
      const workApps: AppUsage[] = [];
      const entertainmentApps: AppUsage[] = [];
      const browserApps: AppUsage[] = [];
      const otherApps: AppUsage[] = [];

      for (const app of parsedApps) {
        if (socialNames.has(app.name)) socialApps.push(app);
        else if (commNames.has(app.name)) commApps.push(app);
        else if (workNames.has(app.name)) workApps.push(app);
        else if (entertainmentNames.has(app.name)) entertainmentApps.push(app);
        else if (browserNames.has(app.name)) browserApps.push(app);
        else otherApps.push(app);
      }
      
      const categories = [];
      
      if (socialApps.length > 0 || commApps.length > 0) {
        categories.push({
          name: 'SOCIAL & COMMUNICATION',
          apps: [...socialApps, ...commApps],
        });
      }
      
      if (workApps.length > 0) {
        categories.push({
          name: 'WORK & PRODUCTIVITY',
          apps: workApps,
        });
      }
      
      if (entertainmentApps.length > 0) {
        categories.push({
          name: 'ENTERTAINMENT',
          apps: entertainmentApps,
        });
      }
      
      if (browserApps.length > 0) {
        categories.push({
          name: 'WEB BROWSING',
          apps: browserApps,
        });
      }
      
      if (otherApps.length > 0) {
        categories.push({
          name: 'OTHER',
          apps: otherApps,
        });
      }
      
      return {
        categories,
      };
    }
    
    console.warn('⚠️ No apps parsed from screenshot, using default data');
    return null;
  } catch (error) {
    console.error('❌ Error parsing OCR text:', error);
    return null;
  }
}

function generateReceiptData(period: 'daily' | 'weekly', parsedData?: Partial<ReceiptData> | null): ReceiptData {
  const now = new Date();
  const endDate = formatDate(now);
  
  let startDate: string;
  if (period === 'weekly') {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    startDate = formatDate(weekAgo);
  } else {
    startDate = endDate;
  }

  const timeString = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const multiplier = period === 'weekly' ? 7 : 1;

  // If we have parsed data from OCR, use it
  if (parsedData?.categories && parsedData.categories.length > 0) {
    console.log('✅ Using parsed data from screenshot');
    return {
      period,
      startDate,
      endDate,
      generatedTime: timeString,
      categories: parsedData.categories,
    };
  }

  // Otherwise, use random generated data
  console.warn('⚠️ No parsed data available, generating random demo data');
  return {
    period,
    startDate,
    endDate,
    generatedTime: timeString,
    categories: [
      {
        name: "SOCIAL & COMMUNICATION",
        apps: [
          { name: "INSTAGRAM", category: "SOCIAL MEDIA", minutes: generateRandomMinutes(30, 180) * multiplier, icon: APP_ICONS.instagram },
          { name: "TWITTER/X", category: "SOCIAL MEDIA", minutes: generateRandomMinutes(20, 120) * multiplier, icon: APP_ICONS.twitter },
          { name: "LINKEDIN", category: "SOCIAL MEDIA", minutes: generateRandomMinutes(40, 200) * multiplier, icon: APP_ICONS.linkedin },
          { name: "MESSAGES", category: "COMMUNICATION", minutes: generateRandomMinutes(10, 60) * multiplier, icon: APP_ICONS.messages },
        ],
      },
      {
        name: "WORK & PRODUCTIVITY",
        apps: [
          { name: "CALENDAR", category: "PRODUCTIVITY", minutes: generateRandomMinutes(10, 40) * multiplier, icon: APP_ICONS.calendar },
          { name: "SLACK", category: "WORK", minutes: generateRandomMinutes(60, 180) * multiplier, icon: APP_ICONS.slack },
          { name: "NOTES", category: "PRODUCTIVITY", minutes: generateRandomMinutes(5, 30) * multiplier, icon: APP_ICONS.notes },
          { name: "MAIL", category: "WORK", minutes: generateRandomMinutes(30, 90) * multiplier, icon: APP_ICONS.mail },
          { name: "NOTION", category: "PRODUCTIVITY", minutes: generateRandomMinutes(20, 80) * multiplier, icon: APP_ICONS.notion },
        ],
      },
      {
        name: "ENTERTAINMENT",
        apps: [
          { name: "YOUTUBE", category: "ENTERTAINMENT", minutes: generateRandomMinutes(60, 240) * multiplier, icon: APP_ICONS.youtube },
          { name: "NETFLIX", category: "STREAMING", minutes: generateRandomMinutes(30, 150) * multiplier, icon: APP_ICONS.netflix },
          { name: "SPOTIFY", category: "MUSIC", minutes: generateRandomMinutes(60, 300) * multiplier, icon: APP_ICONS.spotify },
        ],
      },
    ],
  };
}

function getRecommendation(totalMinutes: number): { main: string; message: string } {
  const hours = totalMinutes / 60;
  
  if (hours < 2) {
    return { main: "IMPRESSIVE!", message: "You're crushing it! 💪" };
  } else if (hours < 4) {
    return { main: "NICE WORK!", message: "You're doing great! 🌟" };
  } else if (hours < 6) {
    return { main: "NOT BAD!", message: "Pretty good! 👍\nMaybe add a walk to your day?" };
  } else if (hours < 10) {
    return { main: "TIME FOR A BREAK!", message: "Go touch some grass 🌱" };
  } else if (hours < 15) {
    return { main: "TIME FOR A BREAK!", message: "Your eyes need a rest! 👀" };
  } else if (hours < 20) {
    return { main: "EMERGENCY!", message: "Touch grass IMMEDIATELY 🌱" };
  } else {
    return { main: "ARE YOU OKAY?", message: "There's a world outside! 🌍" };
  }
}

// Status Bar Component
function StatusBar() {
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
  
  return (
    <div className="md:hidden">
      <div className="absolute bg-gradient-to-b from-[#f3f4f6] from-[32.87%] h-[108px] left-1/2 to-transparent top-0 -translate-x-1/2 w-[402px] max-w-full" />
      <div className="absolute flex gap-[154px] items-center justify-center left-1/2 pb-[19px] pt-[21px] px-[16px] top-0 -translate-x-1/2 w-[402px] max-w-full">
        <div className="basis-0 flex grow h-[22px] items-center justify-center min-h-px min-w-px pb-0 pt-[2px] px-0 relative shrink-0">
          <p className="font-mono font-semibold leading-[22px] relative shrink-0 text-[17px] text-black text-center text-nowrap">
            {currentTime}
          </p>
        </div>
        <div className="basis-0 flex gap-[7px] grow h-[22px] items-center justify-center min-h-px min-w-px pb-0 pt-px px-0 relative shrink-0">
          <div className="relative shrink-0 h-[12.226px] w-[19.2px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.2 12.2264">
              <path clipRule="evenodd" d={svgPaths.cellular} fill="black" fillRule="evenodd" />
            </svg>
          </div>
          <div className="relative shrink-0 h-[12.328px] w-[17.142px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.1417 12.3283">
              <path clipRule="evenodd" d={svgPaths.wifi} fill="black" fillRule="evenodd" />
            </svg>
          </div>
          <div className="h-[13px] relative shrink-0 w-[27.328px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 27.328 13">
              <rect height="12" opacity="0.35" rx="3.8" stroke="black" width="24" x="0.5" y="0.5" />
              <path d={svgPaths.batteryCap} fill="black" opacity="0.4" />
              <rect fill="black" height="9" rx="2.5" width="21" x="2" y="2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// Home Indicator Component
function HomeIndicator({ additionalClassNames = "" }: { additionalClassNames?: string }) {
  return (
    <div className={`md:hidden absolute h-[34px] left-1/2 -translate-x-1/2 w-[400px] max-w-full ${additionalClassNames}`}>
      <div className="absolute bottom-[8px] flex h-[5px] items-center justify-center left-1/2 -translate-x-1/2 w-[144px]">
        <div className="flex-none rotate-180 scale-y-[-1]">
          <div className="bg-black h-[5px] rounded-[100px] w-[144px]" />
        </div>
      </div>
    </div>
  );
}

// Generate Screen Component
function GenerateScreen({ 
  period, 
  onPeriodChange, 
  onGenerate, 
  onUploadClick 
}: { 
  period: 'daily' | 'weekly'; 
  onPeriodChange: (period: 'daily' | 'weekly') => void; 
  onGenerate: () => void;
  onUploadClick: () => void;
}) {
  return (
    <div className="absolute flex flex-col items-center gap-2 justify-center size-full">
    <div className="bg-white flex flex-col gap-[16px] items-center px-[36px] py-[24px] rounded-3xl shadow-[0px_2px_8px_rgba(0,0,0,0.1)] max-w-[90%]">
      <div className="bg-[rgba(116,116,128,0.08)] flex flex-col items-center justify-center p-[8px] relative rounded-full shrink-0 size-[80px]">
        <img src={phoneIconSvg} alt="Phone" className="w-[25px] h-[42px]" />
      </div>
      <div className="font-mono leading-[28px] relative shrink-0 text-[22px] text-black text-center text-nowrap">
        <p className="mb-0">SCREEN TIME</p>
        <p>RECEIPT</p>
      </div>
      <div className="flex items-start relative shrink-0">
        <div className="bg-[rgba(118,118,128,0.12)] flex h-[36px] items-center justify-center overflow-clip px-[5px] py-[4px] relative rounded-[100px] shrink-0 w-[209px]">
          <div
            className="absolute inset-y-[4px] left-[5px] w-[calc(50%-5px)] bg-white rounded-full shadow-[0px_2px_20px_rgba(0,0,0,0.06)]"
            style={{
              transform: period === 'weekly' ? 'translateX(100%)' : 'translateX(0)',
              transition: 'transform 200ms cubic-bezier(0.77, 0, 0.175, 1)',
            }}
          />
          <button
            onClick={() => onPeriodChange('daily')}
            className="basis-0 grow h-full min-h-px min-w-px relative rounded-[7px] shrink-0 cursor-pointer"
          >
            <div className="flex flex-row items-center justify-center size-full">
              <div className="flex items-center justify-center px-[10px] py-[2px] relative size-full">
                <p className={`basis-0 font-mono ${period === 'daily' ? 'font-semibold' : 'font-medium'} grow leading-[18px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-black text-center text-nowrap tracking-[-0.08px]`}>
                  Daily
                </p>
              </div>
            </div>
          </button>
          <button
            onClick={() => onPeriodChange('weekly')}
            className="basis-0 grow h-full min-h-px min-w-px relative shrink-0 cursor-pointer"
          >
            <div className="flex flex-row items-center justify-center size-full">
              <div className="flex items-center justify-center px-[10px] py-[3px] relative size-full">
                <p className={`basis-0 font-mono ${period === 'weekly' ? 'font-semibold' : 'font-medium'} grow leading-[18px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-black text-center text-nowrap`}>
                  Weekly
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-3 py-2">
        <button
          onClick={onGenerate}
          className="bg-zinc-900 flex items-center justify-center px-6 py-[10px] relative rounded-full shrink-0 cursor-pointer hover:bg-zinc-700 transition-colors w-full"
        >
          <p className="font-mono leading-normal relative shrink-0 text-[15px] text-center text-nowrap text-white tracking-[0.75px]">GENERATE</p>
        </button>
        
      </div>
    </div>
    <button
          onClick={onUploadClick}
          className="flex items-center justify-center gap-3.5 px-6 py-2 relative shrink-0 cursor-pointer transition-colors group"
        >
          <img src={uploadIconSvg} alt="" className="h-[15px] w-auto opacity-50 group-hover:opacity-70 transition-opacity" />
          <p className="font-mono leading-normal font-semibold relative shrink-0 text-[15px] text-center text-nowrap text-gray-500 group-hover:text-gray-700 transition-colors">Upload Actual Data</p>
        </button>
    </div>
  );
}

// App Icon Component
function AppIcon({ appName, icon }: { appName: string; icon: string }) {
  const baseStyles = "relative shrink-0 size-[44px]";
  const whiteBackgroundApps = new Set([
    "CALENDAR",
    "SAFARI",
    "BELI",
    "RETRO",
    "NOTION",
  ]);
  const whiteBackgroundShadow = whiteBackgroundApps.has(appName)
    ? "shadow-[0px_2px_8px_rgba(0,0,0,0.15)]"
    : "";
  
  switch (appName) {
    case "INSTAGRAM":
      return (
        <div className={`${baseStyles} rounded-[12px]`}>
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[12px] size-full" src={icon} />
        </div>
      );
    case "TWITTER/X":
      return (
        <div className={`${baseStyles} rounded-[11px]`}>
          <img alt="" className="absolute inset-0 object-cover pointer-events-none rounded-[11px] size-full" src={icon} />
        </div>
      );
    case "LINKEDIN":
      return (
        <div className={`${baseStyles} rounded-[11px]`}>
          <img alt="" className="absolute inset-0 object-cover pointer-events-none rounded-[11px] size-full" src={icon} />
        </div>
      );
    case "MESSAGES":
      return (
        <div className={baseStyles}>
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={icon} />
        </div>
      );
    case "CALENDAR":
      return (
        <div className={`${baseStyles} rounded-[11px] ${whiteBackgroundShadow}`}>
          <img alt="" className="absolute inset-0 object-cover pointer-events-none rounded-[11px] size-full" src={icon} />
        </div>
      );
    case "SLACK":
      return (
        <div className={`${baseStyles} rounded-[12px] shadow-[0px_2px_8px_rgba(0,0,0,0.15)]`}>
          <img alt="" className="absolute inset-0 object-cover pointer-events-none rounded-[12px] size-full" src={icon} />
        </div>
      );
    case "NOTES":
      return (
        <div className={baseStyles}>
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={icon} />
        </div>
      );
    case "MAIL":
      return (
        <div className={baseStyles}>
          <img alt="" className="absolute inset-0 object-cover pointer-events-none size-full" src={icon} />
        </div>
      );
    case "NOTION":
      return (
        <div className={`${baseStyles} rounded-[11px] shadow-[0px_2px_8px_rgba(0,0,0,0.15)]`}>
          <img alt="" className="absolute inset-0 object-cover pointer-events-none rounded-[11px] size-full" src={icon} />
        </div>
      );
    case "YOUTUBE":
      return (
        <div className={`${baseStyles} rounded-[12px] shadow-[0px_2px_8px_rgba(0,0,0,0.15)]`}>
          <img alt="" className="absolute inset-0 object-cover pointer-events-none rounded-[12px] size-full" src={icon} />
        </div>
      );
    case "NETFLIX":
      return (
        <div className={`${baseStyles} rounded-[11px]`}>
          <img alt="" className="absolute inset-0 object-cover pointer-events-none rounded-[11px] size-full" src={icon} />
        </div>
      );
    case "SPOTIFY":
      return (
        <div className={`${baseStyles} rounded-[12px]`}>
          <img alt="" className="absolute inset-0 object-cover pointer-events-none rounded-[12px] size-full" src={icon} />
        </div>
      );
    default:
      return (
        <div className={`${baseStyles} rounded-[12px] overflow-hidden ${whiteBackgroundShadow}`}>
          <img alt="" className="max-w-none object-cover pointer-events-none size-full" src={icon} />
        </div>
      );
  }
}

// Receipt Screen Component
function ReceiptScreen({ 
  data, 
  onSave, 
  onShare, 
  onGenerateNew 
}: { 
  data: ReceiptData; 
  onSave: () => void; 
  onShare: () => void; 
  onGenerateNew: () => void;
}) {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const grandTotal = data.categories.reduce((sum, cat) => 
    sum + cat.apps.reduce((appSum, app) => appSum + app.minutes, 0), 0
  );

  const handleSave = async () => {
    if (!receiptRef.current || isSaving) return;
    
    setIsSaving(true);
    
    try {
      const domToPng = await loadDomToPng();
      const dataUrl = await domToPng(receiptRef.current, {
        scale: 3, // Higher resolution
        backgroundColor: '#ffffff',
      });
      
      // Create download link
      const link = document.createElement('a');
      link.href = dataUrl;
      const dateStr = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit', 
        year: '2-digit'
      }).replace(/\//g, '.');
      link.download = `ScreenTimeReceipt_${dateStr}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save receipt:', error);
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    // Use native Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Screen Time Receipt',
          text: `Check out my ${data.period === 'weekly' ? 'weekly' : 'daily'} screen time receipt!`,
          url: window.location.href,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (err) {
        // User cancelled - don't show success
        console.log('Share cancelled:', err);
      }
    } else {
      // Fallback for browsers without Web Share API
      onShare();
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const recommendation = getRecommendation(grandTotal);

  return (
    <div className="receipt-screen-container flex flex-col gap-6 items-center w-[337px] max-w-[90%] pt-16 pb-24 animate-slide-in transition-transform duration-400 mx-auto">
      <div ref={receiptRef} className="bg-white relative shadow-md shrink-0 w-full border border-zinc-100">
        <div className="flex flex-col items-center size-full">
          <div className="flex flex-col gap-[32px] items-center px-[24px] py-[32px] relative w-full">
            <div className="flex flex-col gap-[24px] items-center relative shrink-0 w-full">
              <div className="flex flex-col font-mono gap-[4px] items-center relative shrink-0 text-center w-[201px] max-w-full">
                <p className="leading-[22px] min-w-full relative shrink-0 text-[17px] text-black font-semibold">DIGITAL RECEIPT</p>
                <p className="leading-[22px] relative shrink-0 text-[13px] text-gray-400 text-nowrap">
                  {data.period === 'weekly' ? 'Weekly' : 'Daily'} Screen Time Summary
                </p>
                <div className="leading-[22px] relative shrink-0 text-[13px] text-gray-500 text-nowrap">
                  <p className="mb-0">{data.startDate} - {data.endDate}</p>
                  <p>Generated {data.generatedTime}</p>
                </div>
              </div>
            </div>

            {data.categories.map((category, idx) => {
              const subtotal = category.apps.reduce((sum, app) => sum + app.minutes, 0);
              
              return (
                <div key={idx} className="flex flex-col gap-[16px] items-start relative shrink-0 w-full">
                  {/* Category Header */}
                  <div className="flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                    <p className="font-mono leading-[22px] font-semibold relative shrink-0 text-[13px] text-black w-full">{category.name}</p>
                    <div className="h-0 relative shrink-0 w-full">
                      <div className="absolute inset-[-1px_0_0_0]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 289 1">
                          <line stroke="gray" strokeOpacity="0.3" x2="289" y1="0.5" y2="0.5" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Apps List */}
                  {category.apps.map((app, appIdx) => (
                    <div key={appIdx} className="flex gap-[16px] items-center relative shrink-0 w-full">
                      <AppIcon appName={app.name} icon={app.icon} />
                      <div className="basis-0 flex font-mono grow items-start justify-between leading-[22px] min-h-px min-w-px relative shrink-0 text-[13px]">
                        <div className="flex flex-col items-start relative shrink-0 w-[97px]">
                          <p className="min-w-full relative shrink-0 text-black font-semibold">{app.name}</p>
                          <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">{app.category}</p>
                        </div>
                        <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap font-semibold">{formatTime(app.minutes)}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Subtotal */}
                  <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                    <div className="h-0 relative shrink-0 w-full">
                      <div className="absolute inset-[-1px_0_0_0]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 289 1">
                          <line stroke="black" strokeDasharray="2 2" strokeOpacity="0.3" x2="289" y1="0.5" y2="0.5" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex font-mono items-start justify-between leading-[22px] relative shrink-0 text-[13px] w-full font-semibold">
                      <p className="relative self-stretch shrink-0 text-[rgba(0,0,0,0.5)] w-[97px]">SUBTOTAL:</p>
                      <p className="relative shrink-0 text-[rgba(0,0,0,0.4)] text-center text-nowrap">{formatTime(subtotal)}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Grand Total & Recommendation */}
            <div className="flex flex-col gap-[24px] items-center relative shrink-0 w-full">
              <div className="flex flex-col gap-[14px] items-start relative shrink-0 w-full">
                {/* Divider */}
                <div className="h-0 relative shrink-0 w-full">
                  <div className="absolute inset-[-1px_0_0_0]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 289 1">
                      <line stroke="black" strokeDasharray="6 3" x2="289" y1="0.5" y2="0.5" />
                    </svg>
                  </div>
                </div>
                <div className="flex font-mono items-start justify-between leading-[22px] relative shrink-0 text-[17px] text-nowrap w-full font-semibold">
                  <p className="relative shrink-0 text-black">GRAND TOTAL:</p>
                  <p className="relative shrink-0 text-[rgba(0,0,0,0.8)] text-center">{formatTime(grandTotal)}</p>
                </div>
                {/* Divider */}
                <div className="h-0 relative shrink-0 w-full">
                  <div className="absolute inset-[-1px_0_0_0]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 289 1">
                      <line stroke="black" strokeDasharray="6 3" x2="289" y1="0.5" y2="0.5" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex flex-col font-mono gap-[16px] items-start relative shrink-0 text-center w-full ">
                <p className="leading-[22px] relative shrink-0 text-[17px] font-semibold text-gray-500 w-full">{recommendation.main}</p>
                <div className="leading-[22px] relative shrink-0 text-[15px] text-gray-400 font-medium w-full whitespace-pre-line">
                  <p className="mb-0">Recommendation:</p>
                  <p>{recommendation.message}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-[24px] items-center justify-center px-0 py-[16px] relative shrink-0 w-full">
        <button onClick={handleSave} disabled={isSaving} className="flex flex-col items-start relative shrink-0 cursor-pointer group disabled:cursor-default">
          <div className="flex flex-col gap-[7px] items-center relative shrink-0 w-[78px]">
            <div className={`flex items-center justify-center relative rounded-full shrink-0 size-[70px] transition-colors ${
              saveSuccess ? 'bg-[#08f]' : isSaving ? 'bg-[#ededed]' : 'bg-[#ededed] group-hover:bg-[#e0e0e0]'
            }`}>
              {isSaving ? (
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
              ) : saveSuccess ? (
                <img src={savedCheckSvg} alt="Saved" className="w-[22px] h-[21px]" />
              ) : (
                <img src={saveIconSvg} alt="Save" className="w-[22px] h-[27px]" />
              )}
            </div>
            <p className="font-mono font-normal leading-[15px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#333] text-[13px] text-center text-nowrap tracking-[-0.1px]">
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save'}
            </p>
          </div>
        </button>
        <button onClick={handleShare} className="flex flex-col items-start relative shrink-0 cursor-pointer group">
          <div className="flex flex-col gap-[7px] items-center relative shrink-0 w-[78px]">
            <div className={`flex items-center justify-center relative rounded-full shrink-0 size-[70px] transition-colors ${
              shareSuccess ? 'bg-[#08f]' : 'bg-[#ededed] group-hover:bg-[#e0e0e0]'
            }`}>
              {shareSuccess ? (
                <img src={savedCheckSvg} alt="Shared" className="w-[22px] h-[21px]" />
              ) : (
                <img src={sendIconSvg} alt="Share" className="w-[26px] h-[26px]" />
              )}
            </div>
            <p className="font-mono font-normal leading-[15px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#333] text-[13px] text-center text-nowrap tracking-[-0.1px]">
              {shareSuccess ? 'Shared' : 'Share'}
            </p>
          </div>
        </button>
      </div>
      
      {/* Generate New Button */}
      <button onClick={onGenerateNew} className="h-[22px] relative shrink-0 w-[204px] cursor-pointer">
        <p className="absolute font-mono inset-0 leading-[22px] text-[15px] text-[rgba(0,0,0,0.5)] text-center text-nowrap hover:text-[rgba(0,0,0,0.7)] transition-colors font-semibold">← Generate New Receipt</p>
      </button>
    </div>
  );
}

// Share Sheet Component
function ShareSheet({ onClose }: { onClose: () => void }) {
  const contacts = [
    { name: "Ashley", emoji: "👩" },
    { name: "Jordan", emoji: "👨" },
    { name: "Gary and Tasha", emoji: "👫" },
    { name: "Steven", emoji: "🧑" },
  ];

  const shareApps = [
    { name: "AirDrop", icon: "📱", color: "bg-blue-500" },
    { name: "Messages", icon: "💬", color: "bg-green-500" },
    { name: "Mail", icon: "📧", color: "bg-blue-400" },
    { name: "Notes", icon: "📝", color: "bg-yellow-300" },
  ];

  const actions = [
    { name: "Copy", icon: "📋" },
    { name: "Add to Favorites", icon: "⭐" },
    { name: "Add to Reading List", icon: "👓" },
    { name: "Add Bookmark", icon: "📖" },
  ];

  const handleAction = (actionName: string) => {
    alert(`${actionName} clicked! (This is a demo)`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-t-[20px] w-full max-w-[402px] pb-8 animate-slide-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center px-8 py-3 border-b border-zinc-100">
          <h3 className="font-mono text-[15px] font-semibold">Screen Time Receipt</h3>
        </div>
        
        <p className="text-center text-[13px] text-gray-400 font-mono py-2">Weekly Time Summary</p>
        
        <div className="px-8 py-3">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {contacts.map((contact, idx) => (
              <button key={idx} className="flex flex-col items-center gap-1 min-w-[60px]">
                <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-3xl">
                  {contact.emoji}
                </div>
                <span className="text-[11px] text-gray-700 font-mono truncate w-full text-center">
                  {contact.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-8 py-3 border-t border-zinc-100">
          <div className="flex gap-4 justify-around">
            {shareApps.map((app, idx) => (
              <button key={idx} className="flex flex-col items-center gap-1">
                <div className={`w-[60px] h-[60px] rounded-[15px] ${app.color} flex items-center justify-center text-3xl shadow-sm`}>
                  {app.icon}
                </div>
                <span className="text-[11px] text-gray-700 font-mono">
                  {app.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-8 py-3 border-t border-zinc-100 space-y-1">
          {actions.map((action, idx) => (
            <button
              key={idx}
              className="flex items-center gap-3 w-full py-3 px-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => handleAction(action.name)}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-[15px] text-gray-900 font-mono">
                {action.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Upload Instructions Component
function UploadInstructions({
  onClose,
  onUploadSuccess,
}: {
  onClose: () => void;
  onUploadSuccess: (parsedData?: Partial<ReceiptData> | null) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Trigger enter animation on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be selected again
    e.target.value = '';

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large. Please upload a file under 10MB.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    // Actually load and validate the image
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        console.log('Image loaded successfully:', {
          width: img.width,
          height: img.height,
          aspectRatio: (img.height / img.width).toFixed(2)
        });
        
        // Check if image dimensions look like a phone screenshot (portrait, reasonable size)
        const isPortrait = img.height > img.width;
        const aspectRatio = img.height / img.width;
        const hasReasonableSize = img.width >= 300 && img.height >= 400;
        
        // Typical phone screenshot aspect ratios are between 1.5 and 2.5
        const looksLikePhoneScreenshot = aspectRatio >= 1.5 && aspectRatio <= 2.5;
        
        if (!isPortrait) {
          setIsProcessing(false);
          setError('Please upload a portrait screenshot from your phone\'s Screen Time settings.');
          return;
        }
        
        if (!hasReasonableSize) {
          setIsProcessing(false);
          setError('Image is too small. Please upload a full-resolution screenshot.');
          return;
        }
        
        if (!looksLikePhoneScreenshot) {
          setIsProcessing(false);
          setError('This doesn\'t look like a phone screenshot. Please upload your Screen Time screenshot from Settings.');
          return;
        }

        console.log('Starting OCR processing...');
        
        // Preprocess image more aggressively for better OCR
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the image
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Convert to grayscale and apply adaptive thresholding
        // This makes light gray text much more visible
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          // If pixel is lighter than threshold, make it white, else black
          const threshold = 180; // Adjust to capture gray text
          const value = avg > threshold ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = value;
        }
        
        ctx.putImageData(imageData, 0, 0);
        const enhancedImageSrc = canvas.toDataURL();
        
        console.log('Image enhanced with grayscale + thresholding');
        
        // Run OCR to check if it's a Screen Time screenshot and extract data
        try {
          const TesseractModule = await import('tesseract.js');
          const worker = await TesseractModule.default.createWorker('eng', 1, {
            logger: (m: { status: string; progress: number }) => {
              if (m.status === 'recognizing text') {
                console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
              }
            },
          });
          let text = '';
          try {
            await worker.setParameters({
              tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ :hmr',
            });
            const result = await worker.recognize(enhancedImageSrc);
            text = result.data.text;
          } finally {
            await worker.terminate();
          }
          
          console.log('OCR completed successfully');
          
          const lowerText = text.toLowerCase();
          
          // Check for multiple Screen Time indicators (more robust validation)
          const indicators = {
            hasScreenTimeText: lowerText.includes('screen time') || lowerText.includes('screentime'),
            hasMostUsed: lowerText.includes('most used') || lowerText.includes('mostused'),
            hasLimits: lowerText.includes('limits') || lowerText.includes('limit'),
            hasCategories: lowerText.includes('categories') || lowerText.includes('category') || lowerText.includes('show categories'),
            hasThisWeek: lowerText.includes('this week') || lowerText.includes('today'),
            hasTimeFormats: /\d+h\s*\d+m|\d+\s*min|\d+:\d+/.test(lowerText),
            hasPickups: lowerText.includes('pickup') || lowerText.includes('pickups'),
            hasAverage: lowerText.includes('average') || lowerText.includes('daily average'),
          };
          
          // Count how many indicators we found
          const indicatorCount = Object.values(indicators).filter(Boolean).length;
          
          console.log('Screen Time validation indicators:', indicators, 'Count:', indicatorCount);
          
          // Need at least 2 indicators to be confident it's a Screen Time screenshot
          // This allows for OCR errors while still validating
          if (indicatorCount < 2) {
            setIsProcessing(false);
            setError('This doesn\'t appear to be a Screen Time screenshot. Please upload your Screen Time data from Settings.');
            return;
          }

          // Parse the OCR text to extract app usage data
          console.log('Starting to parse OCR text...');
          const parsedData = await parseScreenTimeOCR(text);
          console.log('Parsed screen time data:', parsedData);
          
          if (!parsedData || !parsedData.categories || parsedData.categories.length === 0) {
            console.error('❌ Parsing failed - no apps extracted');
            console.error('Raw OCR text:', text);
            setIsProcessing(false);
            // Show first 200 chars of OCR in error for debugging
            const previewText = text.substring(0, 200).replace(/\n/g, ' ');
            setError(`Could not read app data. OCR read: "${previewText}..." Check console for full text.`);
            return;
          }
          
          // Image is valid - generate receipt with parsed data BEFORE closing modal
          onUploadSuccess(parsedData);
        } catch (ocrError) {
          console.error('OCR error:', ocrError);
          setIsProcessing(false);
          setError('Failed to process screenshot. Please try again.');
          return;
        }

        // Then close the modal smoothly with animation
        setTimeout(() => {
          setIsProcessing(false);
          handleClose();
        }, 100);
      };
      
      img.onerror = () => {
        setIsProcessing(false);
        setError('Could not read the image. Please try a different file.');
      };
      
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => {
      setIsProcessing(false);
      setError('Could not read the file. Please try again.');
    };
    
    reader.readAsDataURL(file);
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className={`absolute inset-0 bg-black/5 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
        onClick={handleClose} 
      />
      
      {/* Modal Content */}
      <div 
        className={`upload-modal-content relative bg-white rounded-3xl py-2 pb-4 w-full max-w-[440px] max-h-[90vh] overflow-y-auto shadow-[0px_10px_60px_rgba(0,0,0,0.03)] transition-all duration-300 ease-out ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : isClosing 
              ? 'opacity-0 translate-y-4' 
              : 'opacity-0 translate-y-8'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          .upload-modal-content,
          .upload-modal-content * {
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          }
        `}</style>
        <div className="top-0 bg-white flex items-center justify-center pt-6 w-full rounded-t-[20px]">
          <h2 className="text-lg text-black text-center text-balance max-w-[250px] font-semibold">Upload Your Screen Time Data</h2>
        </div>
        
        <div className="px-8 py-5 space-y-5 text-[15px]">
          <div className="space-y-3.5">
            <h3 className="text-base text-black">iPhone</h3>
            <div className="border-t border-zinc-100" />
            <ol className="space-y-1 pl-10 list-decimal text-gray-500 leading-normal">
              <li>Open <strong>Settings</strong></li>
              <li>Scroll down and tap <strong>Screen Time</strong></li>
              <li>Tap <strong>See All Activity</strong></li>
              <li>Take a screenshot (Side Button + Volume Up)</li>
            </ol>
          </div>

          <div className="space-y-3.5">
            <h3 className="text-base text-black">Android</h3>
            <div className="border-t border-zinc-100" />
            <ol className="space-y-1 pl-10 list-decimal text-gray-500 leading-normal">
              <li>Open <strong>Settings</strong></li>
              <li>Tap <strong>Digital Wellbeing & parental controls</strong></li>
              <li>Take a screenshot (Power + Volume Down)</li>
            </ol>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 rounded-xl px-4.5 py-4 flex items-start gap-1">
              <div className="w-full">
                <p className="text-sm text-red-600 font-semibold">Upload failed</p>
                <p className="text-sm text-red-500 mt-1.5">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="flex-shrink-0 text-red-300 hover:text-red-600 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          <label className="flex items-center justify-center">
            <div className={`${isProcessing ? 'bg-gray-400' : 'bg-gray-900 hover:bg-gray-800'} transition-colors flex items-center justify-center px-5 pt-3.5 pb-[13.5px] rounded-full cursor-pointer`}>
              <p className="text-[15px] leading-none text-center text-white tracking-[0.75px]">
                {isProcessing ? 'PROCESSING...' : 'UPLOAD SCREENSHOT'}
              </p>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              disabled={isProcessing}
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Main Screentime Page Component
export default function ScreentimePage() {
  const navigate = useNavigate();
  
  // Fetch project info from Sanity (with fallback to defaults)
  const projectInfo = useExperimentProject('screentime', DEFAULT_SCREENTIME_PROJECT);
  
  const [screen, setScreen] = useState<Screen>('generate');
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedData, setUploadedData] = useState<Partial<ReceiptData> | null>(null);

  // Handle entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle navigation back to home (or to popup mode if in fullscreen)
  const handleBackToHome = () => {
    // If we're in fullscreen mode, go to popup mode immediately (no exit animation)
    const isFullscreen = window.location.pathname.includes('/full');
    if (isFullscreen) {
      navigate('/project/screentime');
      return;
    }
    
    // Otherwise animate exit then go to home
    setIsExiting(true);
    setTimeout(() => {
      navigate('/');
    }, 280);
  };

  const handleGenerate = () => {
    const data = generateReceiptData(period, uploadedData);
    setReceiptData(data);
    setScreen('receipt');
  };

  const handleSave = () => {
    alert('Receipt saved! (This is a demo - in a real app, this would save to your device)');
  };

  const handleShare = async () => {
    // Use the native Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Screen Time Receipt',
          text: `Check out my ${period === 'weekly' ? 'weekly' : 'daily'} screen time receipt!`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share failed - that's okay
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      setScreen('share');
    }
  };

  const handleCloseShare = () => {
    setScreen('receipt');
  };

  const handleGenerateNew = () => {
    setScreen('generate');
    setReceiptData(null);
    setUploadedData(null); // Clear uploaded data to reset to default demo data
    // Scroll parent modal container to top to reset scroll position
    const modalContainer = document.querySelector('.modal-scroll-container');
    if (modalContainer) {
      modalContainer.scrollTop = 0;
    }
  };

  const handleUpload = () => {
    setShowUploadModal(true);
  };

  const handleCloseUpload = () => {
    setShowUploadModal(false);
  };

  const handleUploadSuccess = (parsedData?: Partial<ReceiptData> | null) => {
    // Store the parsed data and generate receipt with it
    setUploadedData(parsedData || null);
    const data = generateReceiptData(period, parsedData);
    setReceiptData(data);
    setScreen('receipt');
  };

  return (
    <>
      {/* Logo - fixed outside transitioning container, animates in smoothly */}
      <button
        onClick={handleBackToHome}
        className={`fixed top-8 left-6 md:left-16 z-40 cursor-pointer transition-all duration-300 ease-out hover:opacity-80 ${
          isEntering ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
        aria-label="Go back to home"
      >
        <img 
          src={imgLogo} 
          alt="Michelle Liu Logo" 
          className="w-8 h-8 md:w-[44px] md:h-[44px] object-contain"
        />
      </button>

      {/* Info Button - fixed top right */}
      <InfoButton project={projectInfo} />

      <div 
        className={`screentime-page-container relative w-full h-full min-h-screen overflow-hidden px-4 flex flex-col items-center transition-all ${
          screen === 'generate' ? 'justify-center' : 'justify-start'
        } ${
          isExiting ? 'opacity-0 scale-[0.985]' : isEntering ? 'opacity-0 scale-[1.01]' : 'opacity-100 scale-100'
        }`}
        style={{ 
          backgroundColor: projectInfo.backgroundColor || '#f3f4f6',
          transitionDuration: isExiting ? '280ms' : '300ms',
          transitionTimingFunction: isExiting ? 'cubic-bezier(0.4, 0, 0.2, 1)' : 'ease-out'
        }}
      >
        <div className="relative w-full max-w-[402px] mx-auto bg-gray-100">
          {/* Hide status bar on mobile - users already have their real one */}
          <div className="hidden md:block">
            <StatusBar />
          </div>
          <HomeIndicator additionalClassNames="bottom-0" />
          
          {screen === 'generate' && (
            <GenerateScreen 
              period={period}
              onPeriodChange={setPeriod}
              onGenerate={handleGenerate}
              onUploadClick={handleUpload}
            />
          )}
          
          {screen === 'receipt' && receiptData && (
            <ReceiptScreen 
              data={receiptData}
              onSave={handleSave}
              onShare={handleShare}
              onGenerateNew={handleGenerateNew}
            />
          )}
          
          {screen === 'share' && (
            <ShareSheet onClose={handleCloseShare} />
          )}
          
          {showUploadModal && (
            <UploadInstructions onClose={handleCloseUpload} onUploadSuccess={handleUploadSuccess} />
          )}
        </div>
      </div>

      {/* Custom styles */}
      <style>{`
        .screentime-page-container {
          overflow-y: auto;
        }
        
        .screentime-page-container,
        .screentime-page-container * {
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        }
        
        @keyframes slideInFromBottom {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-slide-in {
          animation: slideInFromBottom 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
