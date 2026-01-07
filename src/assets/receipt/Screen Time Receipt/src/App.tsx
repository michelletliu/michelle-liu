import { useState } from "react";
import { StatusBar } from "./components/StatusBar";
import { HomeIndicator } from "./components/HomeIndicator";
import { GenerateScreen } from "./components/GenerateScreen";
import { ReceiptScreen, ReceiptData, APP_ICONS } from "./components/ReceiptScreen";
import { ShareSheet } from "./components/ShareSheet";
import { UploadInstructions } from "./components/UploadInstructions";

type Screen = 'generate' | 'receipt' | 'share' | 'upload';

function generateRandomMinutes(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
}

function generateReceiptData(period: 'daily' | 'weekly'): ReceiptData {
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

  return {
    period,
    startDate,
    endDate,
    generatedTime: timeString,
    categories: [
      {
        name: "SOCIAL & COMMUNICATION",
        apps: [
          {
            name: "INSTAGRAM",
            category: "SOCIAL MEDIA",
            minutes: generateRandomMinutes(30, 180) * multiplier,
            icon: APP_ICONS.instagram,
          },
          {
            name: "TWITTER/X",
            category: "SOCIAL MEDIA",
            minutes: generateRandomMinutes(20, 120) * multiplier,
            icon: APP_ICONS.twitter,
          },
          {
            name: "LINKEDIN",
            category: "SOCIAL MEDIA",
            minutes: generateRandomMinutes(40, 200) * multiplier,
            icon: APP_ICONS.linkedin,
          },
          {
            name: "MESSAGES",
            category: "COMMUNICATION",
            minutes: generateRandomMinutes(10, 60) * multiplier,
            icon: APP_ICONS.messages,
          },
        ],
      },
      {
        name: "WORK & PRODUCTIVITY",
        apps: [
          {
            name: "CALENDAR",
            category: "PRODUCTIVITY",
            minutes: generateRandomMinutes(10, 40) * multiplier,
            icon: APP_ICONS.calendar,
          },
          {
            name: "SLACK",
            category: "WORK",
            minutes: generateRandomMinutes(60, 180) * multiplier,
            icon: APP_ICONS.slack,
          },
          {
            name: "NOTES",
            category: "PRODUCTIVITY",
            minutes: generateRandomMinutes(5, 30) * multiplier,
            icon: APP_ICONS.notes,
          },
          {
            name: "MAIL",
            category: "WORK",
            minutes: generateRandomMinutes(30, 90) * multiplier,
            icon: APP_ICONS.mail,
          },
          {
            name: "NOTION",
            category: "PRODUCTIVITY",
            minutes: generateRandomMinutes(20, 80) * multiplier,
            icon: APP_ICONS.notion,
          },
        ],
      },
      {
        name: "ENTERTAINMENT",
        apps: [
          {
            name: "YOUTUBE",
            category: "ENTERTAINMENT",
            minutes: generateRandomMinutes(60, 240) * multiplier,
            icon: APP_ICONS.youtube,
          },
          {
            name: "NETFLIX",
            category: "STREAMING",
            minutes: generateRandomMinutes(30, 150) * multiplier,
            icon: APP_ICONS.netflix,
          },
          {
            name: "SPOTIFY",
            category: "MUSIC",
            minutes: generateRandomMinutes(60, 300) * multiplier,
            icon: APP_ICONS.spotify,
          },
        ],
      },
    ],
  };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('generate');
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const handleGenerate = () => {
    const data = generateReceiptData(period);
    setReceiptData(data);
    setScreen('receipt');
  };

  const handleSave = () => {
    alert('Receipt saved! (This is a demo - in a real app, this would save to your device)');
  };

  const handleShare = () => {
    setScreen('share');
  };

  const handleCloseShare = () => {
    setScreen('receipt');
  };

  const handleGenerateNew = () => {
    setScreen('generate');
    setReceiptData(null);
  };

  const handleUpload = () => {
    setScreen('upload');
  };

  const handleCloseUpload = () => {
    setScreen('generate');
  };

  return (
    <div className="bg-[#f3f4f6] relative min-h-screen w-full" data-name="Screen Time Receipt App">
      <div className="relative w-full max-w-[402px] min-h-screen mx-auto bg-[#f3f4f6]">
        <StatusBar />
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
        
        {screen === 'upload' && (
          <UploadInstructions onClose={handleCloseUpload} />
        )}
      </div>
    </div>
  );
}