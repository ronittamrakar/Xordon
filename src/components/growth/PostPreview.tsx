import React from 'react';
import { Heart, MessageSquare, Share2, MoreHorizontal, Globe, Image as ImageIcon, BarChart3, Send, RefreshCw, MessageCircle, Plus, Music2, Youtube, Pin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface PostPreviewProps {
  content: string;
  mediaUrls?: string[];
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest';
  accountName?: string;
  accountUsername?: string;
  avatarUrl?: string;
}

export const PostPreview: React.FC<PostPreviewProps> = ({
  content,
  mediaUrls = [],
  platform,
  accountName = 'Your Account',
  accountUsername = 'youraccount',
  avatarUrl,
}) => {
  const renderFacebook = () => (
    <Card className="max-w-md mx-auto overflow-hidden border-none shadow-2xl bg-white text-black rounded-xl">
      <CardContent className="p-0">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border shadow-sm">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">{accountName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-[14px] leading-tight hover:underline cursor-pointer">{accountName}</p>
              <p className="text-[12px] text-gray-500 flex items-center gap-1">Just now · <Globe className="h-3 w-3" /></p>
            </div>
          </div>
          <MoreHorizontal className="h-5 w-5 text-gray-400 cursor-pointer" />
        </div>
        <div className="px-4 pb-3 text-[15px] leading-normal whitespace-pre-wrap">
          {content || "What's on your mind?"}
        </div>
        {mediaUrls.length > 0 && (
          <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden border-y border-gray-100">
            <img src={mediaUrls[0]} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="px-4 py-2 flex items-center justify-between border-b mx-4">
          <div className="flex items-center -space-x-1">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center border border-white z-20">
              <Heart className="h-2 w-2 text-white fill-white" />
            </div>
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center border border-white z-10">
              <Heart className="h-2 w-2 text-white fill-white" />
            </div>
          </div>
          <p className="text-[12px] text-gray-500">0 comments · 0 shares</p>
        </div>
        <div className="p-1 px-4 flex justify-between text-gray-600">
          <Button variant="ghost" size="sm" className="flex-1 gap-2 text-[12px] font-semibold hover:bg-gray-100"><Heart className="h-4 w-4" /> Like</Button>
          <Button variant="ghost" size="sm" className="flex-1 gap-2 text-[12px] font-semibold hover:bg-gray-100"><MessageSquare className="h-4 w-4" /> Comment</Button>
          <Button variant="ghost" size="sm" className="flex-1 gap-2 text-[12px] font-semibold hover:bg-gray-100"><Share2 className="h-4 w-4" /> Share</Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderInstagram = () => (
    <Card className="max-w-md mx-auto overflow-hidden border-none shadow-2xl bg-white text-black rounded-xl">
      <CardContent className="p-0">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-gray-100">{accountName[0]}</AvatarFallback>
              </Avatar>
            </div>
            <p className="font-bold text-[12px]">{accountUsername}</p>
          </div>
          <MoreHorizontal className="h-5 w-5 text-gray-800" />
        </div>
        <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden border-y">
          {mediaUrls.length > 0 ? (
            <img src={mediaUrls[0]} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-30">
              <ImageIcon className="h-10 w-10" />
              <p className="text-[12px] uppercase font-bold tracking-widest">Photo Required</p>
            </div>
          )}
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Heart className="h-6 w-6 hover:text-red-500 transition-colors cursor-pointer" />
              <MessageSquare className="h-6 w-6 hover:opacity-50 transition-opacity cursor-pointer" />
              <Share2 className="h-6 w-6 hover:opacity-50 transition-opacity cursor-pointer" />
            </div>
            <div className="w-6 h-6 border-2 border-black rounded-sm flex items-center justify-center cursor-pointer">
              <div className="w-3 h-3 border-r-2 border-b-2 border-black rotate-45 -translate-y-[1px]" />
            </div>
          </div>
          <div className="text-[14px]">
            <span className="font-bold mr-2">{accountUsername}</span>
            <span className="whitespace-pre-wrap">{content || 'Post caption...'}</span>
          </div>
          <p className="text-[12px] text-gray-500 uppercase tracking-tighter">Just now</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderTwitter = () => (
    <Card className="max-w-md mx-auto overflow-hidden border border-gray-100 shadow-2xl bg-white text-black rounded-2xl">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-12 w-12 border shadow-sm">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-gray-100 font-bold">{accountName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <p className="font-bold text-[15px] hover:underline cursor-pointer">{accountName}</p>
                <p className="text-gray-500 text-[14px]">@{accountUsername} · now</p>
              </div>
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-[15px] leading-normal whitespace-pre-wrap">
              {content || "What's happening?"}
            </div>
            {mediaUrls.length > 0 && (
              <div className="mt-3 rounded-2xl border border-gray-100 overflow-hidden aspect-video bg-gray-50 shadow-sm">
                <img src={mediaUrls[0]} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex justify-between mt-4 text-gray-500 max-w-sm">
              <div className="flex items-center gap-2 group cursor-pointer hover:text-blue-500 transition-colors">
                <div className="p-2 group-hover:bg-blue-100 rounded-full"><MessageSquare className="h-4 w-4" /></div>
                <span className="text-[12px]">0</span>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer hover:text-green-500 transition-colors">
                <div className="p-2 group-hover:bg-green-100 rounded-full"><RefreshCw className="h-4 w-4" /></div>
                <span className="text-[12px]">0</span>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer hover:text-red-500 transition-colors">
                <div className="p-2 group-hover:bg-red-100 rounded-full"><Heart className="h-4 w-4" /></div>
                <span className="text-[12px]">0</span>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer hover:text-blue-500 transition-colors">
                <div className="p-2 group-hover:bg-blue-100 rounded-full"><BarChart3 className="h-4 w-4" /></div>
                <span className="text-[12px]">0</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderLinkedin = () => (
    <Card className="max-w-md mx-auto overflow-hidden border border-gray-200 shadow-2xl bg-white text-black rounded-lg">
      <CardContent className="p-0">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 rounded-none border border-gray-100">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-blue-50 text-blue-700 font-bold">{accountName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-[14px] leading-tight hover:underline hover:text-blue-700 cursor-pointer">{accountName}</p>
              <p className="text-[12px] text-gray-500 leading-tight">Your Professional Headline • Just now</p>
              <p className="text-[12px] text-gray-500 flex items-center gap-1">Just now · <Globe className="h-3 w-3" /></p>
            </div>
          </div>
          <MoreHorizontal className="h-5 w-5 text-gray-500" />
        </div>
        <div className="px-4 py-2 text-[14px] leading-normal whitespace-pre-wrap">
          {content || 'What do you want to talk about?'}
        </div>
        {mediaUrls.length > 0 && (
          <div className="aspect-video bg-gray-50 flex items-center justify-center overflow-hidden border-y border-gray-100">
            <img src={mediaUrls[0]} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="px-4 py-2 flex items-center justify-between border-b mx-2 text-[12px] text-gray-500">
          <div className="flex items-center gap-1">
            <div className="flex items-center -space-x-1">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center border border-white"><Heart className="h-2 w-2 text-white fill-white" /></div>
              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center border border-white"><Heart className="h-2 w-2 text-white fill-white" /></div>
            </div>
            <span>0</span>
          </div>
          <div>0 comments</div>
        </div>
        <div className="p-1 px-4 flex justify-between text-gray-600">
          <Button variant="ghost" size="sm" className="flex-1 gap-1 text-[12px] font-semibold hover:bg-gray-100 rounded-none"><Heart className="h-4 w-4" /> Like</Button>
          <Button variant="ghost" size="sm" className="flex-1 gap-1 text-[12px] font-semibold hover:bg-gray-100 rounded-none"><MessageSquare className="h-4 w-4" /> Comment</Button>
          <Button variant="ghost" size="sm" className="flex-1 gap-1 text-[12px] font-semibold hover:bg-gray-100 rounded-none"><Share2 className="h-4 w-4" /> Repost</Button>
          <Button variant="ghost" size="sm" className="flex-1 gap-1 text-[12px] font-semibold hover:bg-gray-100 rounded-none"><Send className="h-4 w-4" /> Send</Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderTikTok = () => (
    <Card className="max-w-[320px] mx-auto overflow-hidden border-none shadow-2xl bg-black text-white rounded-[40px] aspect-[9/16] relative">
      {mediaUrls.length > 0 ? (
        <img src={mediaUrls[0]} className="absolute inset-0 w-full h-full object-cover opacity-60" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
          <Music2 className="h-20 w-20 text-white/20 animate-pulse" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />
      <div className="absolute right-4 bottom-32 flex flex-col gap-6 items-center">
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-white/10 backdrop-blur">
            {avatarUrl ? <img src={avatarUrl} /> : <div className="w-full h-full flex items-center justify-center font-bold">{accountName[0]}</div>}
          </div>
          <Plus className="h-4 w-4 bg-red-500 rounded-full -mt-2 z-10" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <Heart className="h-8 w-8 fill-white" />
          <span className="text-[12px] font-bold tracking-tight">0</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <MessageCircle className="h-8 w-8 fill-white" />
          <span className="text-[12px] font-bold tracking-tight">0</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Share2 className="h-8 w-8 fill-white" />
          <span className="text-[12px] font-bold tracking-tight">0</span>
        </div>
      </div>
      <div className="absolute left-4 right-16 bottom-10 space-y-3">
        <p className="font-bold text-[16px]">@{accountUsername}</p>
        <p className="text-[14px] line-clamp-3 leading-tight">{content || 'Your TikTok caption here...'}</p>
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <Music2 className="h-4 w-4" />
          <p className="text-[12px] italic">Original Sound - {accountName}</p>
        </div>
      </div>
    </Card>
  );

  switch (platform) {
    case 'facebook': return renderFacebook();
    case 'instagram': return renderInstagram();
    case 'twitter': return renderTwitter();
    case 'linkedin': return renderLinkedin();
    case 'tiktok': return renderTikTok();
    default: return renderFacebook();
  }
};
