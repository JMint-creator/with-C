import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Camera, Image as ImageIcon, Heart, MessageSquare, Send, X } from 'lucide-react';
import { useLocalState, useIDBState, compressImage } from './utils';

interface MomentsViewProps {
  onClose: () => void;
  themeConfig: any;
  cardGroups: any[];
  avatar1: string;
  avatar2: string;
  name1: string;
  name2: string;
  bgImage: string;
  viewStyle?: 'wechat' | 'weibo';
}

interface Comment {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: number;
  publishAt: number; // For delay simulation
  to?: string; // Replied user name if any
}

interface Moment {
  id: string;
  authorName: string;
  authorAvatar: string;
  type: 'user' | 'mengjiao';
  content: string;
  images: string[];
  timestamp: number;
  publishAt: number;
  likes: string[];
  comments: Comment[];
}

export function MomentsView({
  onClose,
  themeConfig,
  cardGroups,
  avatar1,
  avatar2,
  name1,
  name2,
  bgImage,
  viewStyle = 'wechat'
}: MomentsViewProps) {
  const getAuthorName = (oldName: string, type?: 'user' | 'mengjiao') => {
      if (type === 'user') return name1 || '我';
      if (type === 'mengjiao') return name2 || '梦角';
      if (oldName === '我' || oldName === 'Yuli' || oldName === name1) return name1 || '我';
      if (oldName === '梦角' || oldName === 'Milk' || oldName === name2) return name2 || '梦角';
      return oldName;
  };

  const getAuthorAvatar = (oldName: string, oldAvatar: string | undefined, type?: 'user' | 'mengjiao') => {
      if (type === 'user') return avatar1;
      if (type === 'mengjiao') return avatar2;
      if (oldName === '我' || oldName === 'Yuli' || oldName === name1) return avatar1;
      if (oldName === '梦角' || oldName === 'Milk' || oldName === name2) return avatar2;
      return oldAvatar || avatar1;
  };

  const [moments, setMoments] = useIDBState<Moment[]>('app_moments', []);
  const [stickers] = useIDBState<string[]>('app_stickers', []);
  
  const [postContent, setPostContent] = useState('');
  const [showConfirm, setShowConfirm] = useState<{title: string, onConfirm: () => void} | null>(null);
  const [postImages, setPostImages] = useState<string[]>([]);
  const postImageIconRef = useRef<HTMLInputElement>(null);
  const [isPosting, setIsPosting] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 3000);
  };

  const [lastMengjiaoPostTime, setLastMengjiaoPostTime] = useLocalState<number>('last_mengjiao_post', 0);
  const [replyInputVisible, setReplyInputVisible] = useState<string | null>(null); // Moment ID
  const [replyToUser, setReplyToUser] = useState<string | null>(null); // To name
  const [replyContent, setReplyContent] = useState('');
  const [now, setNow] = useState(Date.now());

  // Timer to update 'now' to reveal scheduled posts/comments
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 10000); // Check every 10s
    return () => clearInterval(timer);
  }, []);

  // Get all cards to pick from
  const getAllCards = () => {
    let allCards: string[] = [];
    cardGroups.forEach(g => {
      if (g.cards && Array.isArray(g.cards)) {
        allCards = allCards.concat(g.cards);
      }
    });
    return allCards;
  };

  const pickRandomCards = (min: number, max: number) => {
    const cards = getAllCards();
    if (cards.length === 0) return '我还不太会说话哦...';
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    let res = [];
    for (let i = 0; i < count; i++) {
        res.push(cards[Math.floor(Math.random() * cards.length)]);
    }
    return res.join(' ');
  };

  // Logic to simulate Mengjiao post (30% chance)
  useEffect(() => {
     // Check if Mengjiao should post
     const current = Date.now();
     // If last post was more than 12 hours ago
     if (current - lastMengjiaoPostTime > 12 * 60 * 60 * 1000) {
        const rand = Math.random();
        if (rand < 0.3) { // 30% chance
            const content = pickRandomCards(3, 6);
            // Delay 1-3 hours
            const delayHours = 1 + Math.random() * 2;
            const delayMs = delayHours * 60 * 60 * 1000;
            
            import('idb-keyval').then(({ get }) => {
                get('app_stickers').then((loadedStickers: string[] | undefined) => {
                    let st = loadedStickers || [];
                    if (st.length === 0) {
                        try {
                           const localVal = window.localStorage.getItem('app_stickers');
                           if (localVal) st = JSON.parse(localVal) || [];
                        } catch(e) {}
                    }
                    let postImages: string[] = [];
                    if (Math.random() < 0.25 && st.length > 0) {
                        postImages = [st[Math.floor(Math.random() * st.length)]];
                    }
                    
                    const newMoment: Moment = {
                        id: Date.now().toString(),
                        authorName: name2 || '梦角',
                        authorAvatar: avatar2,
                        type: 'mengjiao',
                        content,
                        images: postImages,
                        timestamp: current + delayMs,
                        publishAt: current + delayMs,
                        likes: [],
                        comments: []
                    };
                    setMoments(prev => [newMoment, ...prev]);
                    setLastMengjiaoPostTime(current);
                });
            });
        } else {
            // Even if no post, update time so we don't keep firing 30% chance every render
            setLastMengjiaoPostTime(current);
        }
     }
  }, []);

  const handleDeleteMoment = (momentId: string) => {
      setShowConfirm({
          title: '确定删除这条动态吗？',
          onConfirm: () => {
              setMoments(prev => prev.filter(m => m.id !== momentId));
          }
      });
  };

  const handleDeleteComment = (momentId: string, commentId: string) => {
      setShowConfirm({
          title: '删除这条评论？',
          onConfirm: () => {
              setMoments(prev => {
                  const next = [...prev];
                  const idx = next.findIndex(m => m.id === momentId);
                  if (idx > -1) {
                      const m = {...next[idx]};
                      m.comments = m.comments.filter(c => c.id !== commentId);
                      next[idx] = m;
                  }
                  return next;
              });
          }
      });
  };

  const handleCreatePost = () => {
     if (!postContent.trim() && postImages.length === 0) return;
     const current = Date.now();
     const newMoment: Moment = {
         id: current.toString(),
         authorName: name1 || '我',
         authorAvatar: avatar1,
         type: 'user',
         content: postContent,
         images: postImages,
         timestamp: current,
         publishAt: current,
         likes: [],
         comments: []
     };
     setNow(current);
     setMoments(prev => [newMoment, ...prev]);
     setPostContent('');
     setPostImages([]);
     setIsPosting(false);

     // Trigger Mengjiao like/reply
     scheduleMengjiaoAction(newMoment.id);
  };

  const scheduleMengjiaoAction = (momentId: string, replyToCommentId?: string) => {
     // Post action: like + comment
     // 1-3 hours delay
     const delayHours = 1 + Math.random() * 2;
     const delayMs = delayHours * 60 * 60 * 1000;
     setTimeout(() => {
        setMoments(prev => {
            const next = [...prev];
            const idx = next.findIndex(m => m.id === momentId);
            if (idx === -1) return prev;
            const targetMoment = {...next[idx]};

            // sometimes like
            if (!replyToCommentId && Math.random() > 0.2 && !targetMoment.likes.includes(name2 || '梦角')) {
                targetMoment.likes = [...targetMoment.likes, name2 || '梦角'];
                showToast(`${name2 || '梦角'} 赞了你的朋友圈`);
            }

            // add comment
            const content = pickRandomCards(1, 5);
            const newComment: Comment = {
                id: Date.now().toString(),
                authorName: name2 || '梦角',
                authorAvatar: avatar2,
                content,
                timestamp: Date.now(),
                publishAt: Date.now(),
                to: replyToCommentId ? (name1 || '我') : undefined
            };
            targetMoment.comments = [...targetMoment.comments, newComment];
            next[idx] = targetMoment;
            
            showToast(`${name2 || '梦角'} 刚刚回复了你`);
            
            if ('Notification' in window && window.Notification.permission === 'granted') {
                try {
                    new window.Notification(name2 || '梦角', { body: '在朋友圈有了新互动' });
                } catch(e) {}
            }

            return next;
        });
        setNow(Date.now());
     }, delayMs);
  };

  const handleLike = (momentId: string) => {
      setMoments(prev => {
         const next = [...prev];
         const idx = next.findIndex(m => m.id === momentId);
         if (idx > -1) {
             const m = {...next[idx]};
             const hasLiked = m.likes.some(n => getAuthorName(n) === (name1 || '我'));
             if (hasLiked) {
                 m.likes = m.likes.filter(n => getAuthorName(n) !== (name1 || '我'));
             } else {
                 m.likes = [...m.likes, name1 || '我'];
             }
             next[idx] = m;
         }
         return next;
      });
  };

  const submitReply = (momentId: string) => {
      if (!replyContent.trim()) return;
      const t = Date.now();
      const newComment: Comment = {
          id: t.toString(),
          authorName: name1 || '我',
          authorAvatar: avatar1,
          content: replyContent,
          timestamp: t,
          publishAt: t,
          to: replyToUser || undefined
      };
      
      let isReplyToMengjiao = false;

      setNow(t);
      setMoments(prev => {
          const next = [...prev];
          const idx = next.findIndex(m => m.id === momentId);
          if (idx > -1) {
              const m = {...next[idx]};
              m.comments = [...m.comments, newComment];
              next[idx] = m;
              if (m.type === 'mengjiao' && !replyToUser) isReplyToMengjiao = true;
              if (replyToUser === name2) isReplyToMengjiao = true;
          }
          return next;
      });
      setReplyContent('');
      setReplyInputVisible(null);
      setReplyToUser(null);

      // If user replied to Mengjiao, Mengjiao replies back
      if (isReplyToMengjiao) {
          scheduleMengjiaoAction(momentId, newComment.id);
      }
  };

  const visibleMoments = moments.filter(m => m.publishAt <= now).sort((a,b) => b.publishAt - a.publishAt);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 bg-white/40 backdrop-blur-3xl`}>
      {/* Toast Notification */}
      {toastMessage && (
          <div className="absolute top-[80px] left-1/2 -translate-x-1/2 z-50 bg-black/75 text-white px-4 py-2 rounded-full text-[14px] shadow-lg animate-in slide-in-from-top fade-in duration-300">
              {toastMessage}
          </div>
      )}

      {/* Header */}
      <div className="absolute top-0 w-full z-10 flex justify-between items-center px-4 pt-[env(safe-area-inset-top)] pb-2 bg-gradient-to-b from-black/50 to-transparent text-white">
          <button onClick={onClose} className="p-2 -ml-2 hover:bg-black/10 rounded-full active:opacity-50 transition-colors">
             <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-1 -mr-2">
              <button onClick={() => setIsPosting(true)} className="p-2 hover:bg-black/10 rounded-full active:opacity-50 transition-colors">
                 <Camera size={24} />
              </button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-safe">
          {/* Cover & Avatar */}
          {viewStyle === 'weibo' ? (
              <div className="bg-[#f2f2f2] pb-2">
                  <div 
                      className="w-full h-[150px] bg-cover bg-center bg-gray-200"
                      style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}
                  />
                  <div className="bg-white relative -mt-3 rounded-t-[16px] px-4 pb-4 pt-1 flex shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                      <div className="w-[84px] h-[84px] rounded-full overflow-hidden border-[3px] border-white bg-gray-100 shadow-sm shrink-0 -mt-8 relative z-10">
                          {avatar1 ? <img src={avatar1} className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
                      </div>
                      <div className="ml-4 flex flex-col pt-1">
                          <div className="text-[20px] font-bold text-[#333] leading-none mb-1">
                              {name1 || '我'}
                          </div>
                          <div className="flex gap-4 text-[13px] text-gray-500 mt-1">
                             <div><span className="font-bold text-[#333] text-[15px]">1</span> 粉丝</div>
                             <div><span className="font-bold text-[#333] text-[15px]">1</span> 关注</div>
                          </div>
                      </div>
                  </div>
              </div>
          ) : (
              <div className="relative pb-10 bg-white">
                  <div 
                    className="w-full aspect-square max-h-[300px] bg-cover bg-center bg-gray-200"
                    style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}
                  >
                      {!bgImage && <div className="w-full h-full flex items-center justify-center text-gray-400">请前往外观设置设置背景</div>}
                  </div>
                  
                  <div className="absolute bottom-4 right-4 flex items-end">
                      <span 
                        className="text-white text-[18px] font-bold drop-shadow-md"
                        style={{ marginRight: '16px', paddingBottom: '30px' }}
                      >{name1 || '我'}</span>
                      <div className="w-[72px] h-[72px] rounded-lg overflow-hidden border-2 border-white bg-gray-100 shadow-md">
                          {avatar1 ? <img src={avatar1} className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
                      </div>
                  </div>
              </div>
          )}

          {/* List */}
          <div className={viewStyle === 'wechat' ? "px-4 pb-20 mt-4" : "pb-20 pt-2"}>
              {visibleMoments.map(moment => {
                  const visibleComments = moment.comments.filter(c => c.publishAt <= now);
                  
                  if (viewStyle === 'weibo') {
                     return (
                         <div key={moment.id} className="bg-white mb-2 pt-4 pb-2 px-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                             {/* Weibo Header: Avatar + Info */}
                             <div className="flex items-center gap-3 mb-2">
                                 <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                                     {getAuthorAvatar(moment.authorName, moment.authorAvatar, moment.type) && <img src={getAuthorAvatar(moment.authorName, moment.authorAvatar, moment.type)} className="w-full h-full object-cover"/>}
                                 </div>
                                 <div className="flex-1 flex flex-col justify-center">
                                     <div className="font-semibold text-[15px] text-[#eb7350] leading-tight">{getAuthorName(moment.authorName, moment.type)}</div>
                                     <div className="text-[11px] text-gray-400 mt-0.5">
                                         {new Date(moment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                     </div>
                                 </div>
                                 {moment.type === 'user' && (
                                     <button onClick={() => handleDeleteMoment(moment.id)} className="text-gray-400 active:opacity-50"><X size={18}/></button>
                                 )}
                             </div>

                             {/* Weibo Content */}
                             <div className="text-[15px] text-[#333] whitespace-pre-wrap leading-relaxed mb-2">
                                 {moment.content}
                             </div>
                             {moment.images.length > 0 && (
                                 <div className="grid grid-cols-3 gap-1 mb-3 max-w-[280px]">
                                     {moment.images.map((img, idx) => (
                                         <div key={idx} className="aspect-square bg-gray-100 overflow-hidden rounded-[4px]">
                                             <img src={img} className="w-full h-full object-cover" />
                                         </div>
                                     ))}
                                 </div>
                             )}

                             {/* Weibo Interactions */}
                             <div className="flex justify-between items-center border-t border-gray-100 mt-2 mx-[-16px] px-4 pt-2 pb-1">
                                 <div className="flex-1 flex justify-center text-gray-500 text-[13px] gap-1 items-center">
                                   <Send size={16} className="-scale-x-100"/> 转发
                                 </div>
                                 <div className="w-[1px] h-3 bg-gray-200"></div>
                                 <button onClick={() => {
                                     setReplyInputVisible(moment.id);
                                     setReplyToUser(null);
                                 }} className="flex-1 flex justify-center text-gray-500 text-[13px] gap-1 items-center active:bg-black/5 rounded-full py-1">
                                   <MessageSquare size={16} /> {visibleComments.length || '评论'}
                                 </button>
                                 <div className="w-[1px] h-3 bg-gray-200"></div>
                                 <button onClick={() => handleLike(moment.id)} className={`flex-1 flex justify-center text-[13px] gap-1 items-center active:bg-black/5 rounded-full py-1 ${moment.likes.some(n => getAuthorName(n) === (name1 || '我')) ? 'text-[#eb7350]' : 'text-gray-500'}`}>
                                   <Heart size={16} className={moment.likes.some(n => getAuthorName(n) === (name1 || '我')) ? 'fill-[#eb7350]' : ''} /> {moment.likes.length || '赞'}
                                 </button>
                             </div>

                             {/* Weibo Comments Preview */}
                             {visibleComments.length > 0 && (
                                 <div className="bg-[#f9f9f9] rounded-[4px] mt-2 p-3 text-[13px]">
                                     {visibleComments.map(c => {
                                         const resolvedAuthor = getAuthorName(c.authorName);
                                         const resolvedTo = c.to ? getAuthorName(c.to) : undefined;
                                         return (
                                         <div 
                                           key={c.id} 
                                           className="break-all cursor-pointer active:bg-black/5 rounded-sm px-1 -mx-1 mb-1 last:mb-0"
                                           onClick={() => {
                                               if (resolvedAuthor !== (name1 || '我')) {
                                                   setReplyInputVisible(moment.id);
                                                   setReplyToUser(resolvedAuthor);
                                               } else {
                                                   handleDeleteComment(moment.id, c.id);
                                               }
                                           }}
                                         >
                                             <span className="text-[#eb7350]">{resolvedAuthor}</span>
                                             {resolvedTo && <> <span className="text-gray-500 mx-1">回复</span> <span className="text-[#eb7350]">{resolvedTo}</span></>}
                                             <span className="text-[#333]">：{c.content}</span>
                                         </div>
                                     )})}
                                 </div>
                             )}
                         </div>
                     );
                  }

                  return (
                      <div key={moment.id} className="flex gap-3 mb-8 border-b border-gray-100 pb-4 last:border-b-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                              {getAuthorAvatar(moment.authorName, moment.authorAvatar, moment.type) && <img src={getAuthorAvatar(moment.authorName, moment.authorAvatar, moment.type)} className="w-full h-full object-cover"/>}
                          </div>
                          <div className="flex-1">
                              <div className="font-semibold text-[15px] sm:text-[16px] text-[#576b95] mb-1">{getAuthorName(moment.authorName, moment.type)}</div>
                              <div className="text-[14px] sm:text-[15px] text-[#333] whitespace-pre-wrap leading-relaxed">
                                  {moment.content}
                              </div>
                              {moment.images.length > 0 && (
                                  <div className="grid grid-cols-3 gap-1 mt-2 mb-2 max-w-[280px]">
                                      {moment.images.map((img, idx) => (
                                          <div key={idx} className="aspect-square bg-gray-100 overflow-hidden">
                                              <img src={img} className="w-full h-full object-cover" />
                                          </div>
                                      ))}
                                  </div>
                              )}
                              
                              <div className="flex justify-between items-center mt-3 relative">
                                  <div className="flex items-center gap-3">
                                      <span className="text-[12px] text-gray-400">
                                          {new Date(moment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      {moment.type === 'user' && (
                                          <button onClick={() => handleDeleteMoment(moment.id)} className="text-[13px] text-[#576b95] active:opacity-50 font-medium">删除</button>
                                      )}
                                  </div>
                                  <div className="flex bg-gray-100 rounded-[4px] px-2 py-1 items-center space-x-4">
                                      <button onClick={() => handleLike(moment.id)} className="flex items-center gap-1 active:opacity-50 transition-opacity">
                                          <Heart size={14} className={moment.likes.some(n => getAuthorName(n) === (name1 || '我')) ? 'fill-[#576b95] text-[#576b95]' : 'text-[#576b95]'} />
                                      </button>
                                      <button onClick={() => {
                                          setReplyInputVisible(moment.id);
                                          setReplyToUser(null);
                                      }} className="active:opacity-50 transition-opacity text-[#576b95]">
                                          <MessageSquare size={14} />
                                      </button>
                                  </div>
                              </div>

                              {/* Likes & Comments Box */}
                              {(moment.likes.length > 0 || visibleComments.length > 0) && (
                                  <div className="bg-[#f7f7f7] rounded-[4px] mt-2.5 p-2 px-2.5 text-[13px] sm:text-[14px]">
                                      {moment.likes.length > 0 && (
                                          <div className="text-[#576b95] font-medium flex items-center gap-1.5 break-all">
                                              <Heart size={12} className="fill-[#576b95]" /> 
                                              {moment.likes.map(n => getAuthorName(n)).join('，')}
                                          </div>
                                      )}
                                      
                                      {moment.likes.length > 0 && visibleComments.length > 0 && (
                                          <div className="border-t border-black/5 my-1.5 scale-y-50"></div>
                                      )}

                                      {visibleComments.length > 0 && (
                                          <div className="space-y-1">
                                              {visibleComments.map(c => {
                                                  const resolvedAuthor = getAuthorName(c.authorName);
                                                  const resolvedTo = c.to ? getAuthorName(c.to) : undefined;
                                                  return (
                                                  <div 
                                                    key={c.id} 
                                                    className="break-all cursor-pointer active:bg-black/5 rounded-sm px-1 -mx-1"
                                                    onClick={() => {
                                                        if (resolvedAuthor !== (name1 || '我')) {
                                                            setReplyInputVisible(moment.id);
                                                            setReplyToUser(resolvedAuthor);
                                                        } else {
                                                            handleDeleteComment(moment.id, c.id);
                                                        }
                                                    }}
                                                  >
                                                      <span className="text-[#576b95] font-semibold">{resolvedAuthor}</span>
                                                      {resolvedTo && <> <span className="text-[#333]">回复</span> <span className="text-[#576b95] font-semibold">{resolvedTo}</span></>}
                                                      <span className="text-[#333]">：{c.content}</span>
                                                  </div>
                                              )})}
                                          </div>
                                      )}
                                  </div>
                              )}
                          </div>
                      </div>
                  )
              })}
              
              {visibleMoments.length === 0 && (
                  <div className="text-center mt-20 text-gray-400 text-[14px]">暂无动态</div>
              )}
          </div>
      </div>

      {/* Reply Input Overlay */}
      {replyInputVisible && (
          <div className="fixed inset-0 z-50 bg-black/20 flex flex-col justify-end">
              <div className="flex-1" onClick={() => setReplyInputVisible(null)}></div>
              <div className="bg-[#f2f2f2] p-3 pb-safe-offset-3 px-4 flex items-end gap-2 border-t border-[#e5e5ea] animate-in slide-in-from-bottom-2 duration-200">
                  <div className="flex-1 bg-white rounded-lg min-h-[36px] max-h-[100px] overflow-y-auto px-3 py-2 flex items-center">
                    <textarea 
                      autoFocus
                      placeholder={replyToUser ? `回复${replyToUser}` : '评论'}
                      className="w-full bg-transparent outline-none text-[15px] resize-none pb-0"
                      rows={1}
                      value={replyContent}
                      onChange={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                          setReplyContent(e.target.value);
                      }}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              submitReply(replyInputVisible);
                          }
                      }}
                    />
                  </div>
                  <button 
                    onClick={() => submitReply(replyInputVisible)}
                    disabled={!replyContent.trim()}
                    className={`shrink-0 py-2 px-3 rounded-lg font-medium transition-colors ${replyContent.trim() ? 'bg-[#576b95] text-white active:bg-opacity-80' : 'bg-gray-300 text-gray-100'}`}
                  >
                      发送
                  </button>
              </div>
          </div>
      )}

      {/* Post Editor Overlay */}
      {isPosting && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
             <div className="flex justify-between items-center px-4 py-3 pt-[env(safe-area-inset-top)] border-b border-gray-100">
                 <button onClick={() => setIsPosting(false)} className="text-[15px] text-[#333] active:opacity-50">取消</button>
                 <button 
                   onClick={handleCreatePost} 
                   disabled={!postContent.trim() && postImages.length === 0}
                   className={`px-4 py-1.5 rounded-[4px] text-[14px] font-medium transition-colors ${(postContent.trim() || postImages.length > 0) ? 'bg-[#07c160] text-white active:bg-green-600' : 'bg-[#e5e5e5] text-gray-400'}`}
                 >
                     发表
                 </button>
             </div>
             <div className="flex-1 p-4 overflow-y-auto">
                 <textarea 
                     className="w-full outline-none text-[16px] resize-none min-h-[100px]"
                     placeholder="这一刻的想法..."
                     value={postContent}
                     onChange={e => setPostContent(e.target.value)}
                 />
                 
                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
                     {postImages.map((img, i) => (
                         <div key={i} className="aspect-square bg-gray-100 relative rounded-md overflow-hidden">
                             <img src={img} className="w-full h-full object-cover" />
                             <button onClick={() => setPostImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center active:opacity-50"><X size={12} /></button>
                         </div>
                     ))}
                     {postImages.length < 9 && (
                         <div onClick={() => postImageIconRef.current?.click()} className="aspect-square bg-gray-100 flex items-center justify-center rounded-md cursor-pointer active:bg-gray-200 transition-colors">
                             <ImageIcon className="text-gray-400" size={32} />
                         </div>
                     )}
                 </div>
                 <input 
                    type="file" 
                    ref={postImageIconRef} 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                    onChange={async (e) => {
                        const files = e.target.files;
                        if (!files) return;
                        const newImages = [...postImages];
                        const filesArr = Array.from(files).slice(0, 9 - newImages.length);
                        for (const file of filesArr) {
                            try {
                                const dataUrl = await compressImage(file as File);
                                newImages.push(dataUrl);
                            } catch (err) {
                                console.error('Failed to compress image:', err);
                            }
                        }
                        setPostImages([...newImages]);
                        e.target.value = '';
                    }} 
                 />
             </div>
          </div>
      )}

      {/* Confirm Dialog Overlay */}
      {showConfirm && (
          <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center animate-in fade-in duration-200" onClick={() => setShowConfirm(null)}>
              <div className="bg-white rounded-[12px] w-[280px] overflow-hidden scale-in-95 duration-200 shadow-xl" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6 text-center text-[16px] font-medium text-[#333]">
                      {showConfirm.title}
                  </div>
                  <div className="flex border-t border-gray-100 font-medium">
                      <button 
                        onClick={() => setShowConfirm(null)} 
                        className="flex-1 py-3.5 text-[16px] text-gray-500 border-r border-gray-100 active:bg-black/5 transition-colors"
                      >
                          取消
                      </button>
                      <button 
                        onClick={() => {
                            showConfirm.onConfirm();
                            setShowConfirm(null);
                        }} 
                        className="flex-1 py-3.5 text-[16px] text-[#576b95] font-semibold active:bg-black/5 transition-colors"
                      >
                          确定
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
