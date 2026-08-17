export type Product = "Meitu" | "BeautyCam" | "Wink";
export type Application = { id:string; name:string; handle:string; city:string; province?:string; category:string; product:Product; followers:string; status:string; score:number; submitted:string; avatar:string; email?:string; whatsapp?:string; dateOfBirth?:string; tiktokUrl?:string; instagramUrl?:string; threadsUrl?:string; tiktokFollowers?:string; instagramFollowers?:string; threadsFollowers?:string; interestedApps?:string; featuresUsed?:string; motivation?:string; impressions?:string; declineReason?:string };
export type Task = { id:string; title:string; product:Product; platform:string; deadline:string; joined:number; budget:number; status:string; progress:number; cover:string; niches?:string; brief?:string; referenceLink?:string; tutorialLink?:string; startsAt?:string };
export type Submission = { id:string; creator:string; task:string; product:Product; platform:string; views:number; aiViews:number; totalEngagement?:number; analyticsStatus?:string; recommendation:string; confidence:number; status:string; submitted:string; avatar:string; postUrl?:string; publishedAt?:string; boostCode?:string; evidenceKey?:string; evidenceName?:string; engagementRate?:number; whatsapp?:string; submittedAt?:string; qualificationReason?:string };
export type Reward = { id:string; creator:string; task:string; product:Product; views:number; type:string; amount:number; status:string; submissionId?:string; paymentFormChecked?:number; paidAt?:string; failureReason?:string };
export type CreatorTask = { id:string; creator:string; taskId:string; joinedAt:string; status:string };
export type AppExpansionRequest = { id:string; creator:string; currentApps:string; requestedApps:string; reason:string; status:string; submitted:string; declineReason?:string };
export type StreakRequest = { id:string; creator:string; completedTasks:number; selectedApp:Product; status:string; vipCode?:string; submitted:string; reviewedAt?:string; startTaskCount?:number; startedAt?:string };
export type PaymentForm = { id:string; product:Product; month:string; url:string; updatedAt?:string };
export type CreatorProfile = { id:string; creator:string; niches:string; displayName?:string; contactEmail?:string; avatarKey?:string; avatarName?:string; tiktokUrl?:string; instagramUrl?:string; threadsUrl?:string; whatsapp?:string; updatedAt?:string };

export const applications: Application[] = [
  {id:"APP-1048",name:"Nadia Prameswari",handle:"@nadiaspace",city:"Kota Bandung",province:"Jawa Barat",category:"Beauty",product:"BeautyCam",followers:"128K",status:"In review",score:94,submitted:"18 min ago",avatar:"NP",email:"nadia@example.com",whatsapp:"628111234567",tiktokUrl:"https://www.tiktok.com/@nadiaspace",instagramUrl:"https://www.instagram.com/nadiaspace",threadsUrl:"https://www.threads.net/@nadiaspace",tiktokFollowers:"100.000 - 250.000 Followers",instagramFollowers:"50.000 - 100.000 Followers",threadsFollowers:"50.000 - 100.000 Followers",interestedApps:"Meitu,BeautyCam",featuresUsed:"Saya paling sering memakai AI Retouch, Skin Smoother, dan filter portrait natural untuk tutorial before-after.",motivation:"Saya ingin membuat tutorial editing yang mudah diikuti sekaligus membangun kolaborasi jangka panjang dengan brand global seperti Meitu."},
  {id:"APP-1047",name:"Raka Aditya",handle:"@rakaframe",city:"Kota Surabaya",province:"Jawa Timur",category:"Lifestyle",product:"Wink",followers:"86K",status:"In review",score:87,submitted:"42 min ago",avatar:"RA",email:"raka@example.com",whatsapp:"628121234567",tiktokUrl:"https://www.tiktok.com/@rakaframe",tiktokFollowers:"50.000 - 100.000 Followers",interestedApps:"Wink",featuresUsed:"Video Enhancer, Auto Cut, transisi, dan template beat-sync di Wink untuk video lifestyle dan travel.",motivation:"Saya tertarik mengeksplorasi brief yang memberi ruang untuk storytelling visual dan menjangkau audiens baru."},
  {id:"APP-1046",name:"Salsa Nabila",handle:"@salsaglow",city:"Kota Jakarta Selatan",province:"DKI Jakarta",category:"Beauty",product:"Meitu",followers:"214K",status:"In review",score:72,submitted:"2h ago",avatar:"SN",email:"salsa@example.com",whatsapp:"628141234567",tiktokUrl:"https://www.tiktok.com/@salsaglow",instagramUrl:"https://www.instagram.com/salsanabila",tiktokFollowers:"100.000 - 250.000 Followers",instagramFollowers:"50.000 - 100.000 Followers",interestedApps:"Meitu,BeautyCam,Wink",featuresUsed:"Remove Background, AI Retouch, Makeup, dan Video Enhancer untuk membuat konten transformasi yang tetap natural.",motivation:"Saya ingin membantu followers menemukan workflow editing yang cepat, lalu berkembang menjadi monthly KOL Meitu."},
  {id:"APP-1045",name:"Dimas Kurnia",handle:"@dimascuts",city:"Kota Yogyakarta",province:"DI Yogyakarta",category:"Editing / Photography",product:"Wink",followers:"52K",status:"In review",score:81,submitted:"Yesterday",avatar:"DK",email:"dimas@example.com",whatsapp:"628151234567",instagramUrl:"https://www.instagram.com/dimascuts",instagramFollowers:"50.000 - 100.000 Followers",interestedApps:"Wink",featuresUsed:"Saya menggunakan Video Quality Repair, interpolasi gerak, dan preset transisi untuk konten cinematic pendek.",motivation:"Creator Pool menarik karena ada brief yang jelas, dukungan exposure, dan peluang membangun portofolio bersama Meitu."},
];

export const tasks: Task[] = [
  {id:"TSK-2408",title:"Summer Glow Retouch",product:"Meitu",platform:"TikTok · Instagram",deadline:"2026-08-12",joined:28,budget:0,status:"Active",progress:68,cover:"peach",niches:"Beauty,Lifestyle,Fashion",brief:"Tunjukkan transformasi summer glow yang natural dan mudah diikuti audiens.",referenceLink:"https://www.tiktok.com/tag/summerglow",tutorialLink:"https://www.meitu.com/",startsAt:"2026-08-01"},
  {id:"TSK-2407",title:"One-Tap Portrait Studio",product:"BeautyCam",platform:"TikTok",deadline:"2026-08-16",joined:19,budget:0,status:"Active",progress:46,cover:"blue",niches:"Beauty,Fashion,Family / Couple",brief:"Buat tutorial portrait studio satu sentuhan dengan hasil sebelum dan sesudah yang jelas.",referenceLink:"https://www.tiktok.com/tag/portrait",tutorialLink:"https://www.beautycam.com/",startsAt:"2026-08-03"},
  {id:"TSK-2406",title:"Before / After Motion",product:"Wink",platform:"TikTok · Reels",deadline:"2026-08-20",joined:34,budget:0,status:"Scheduled",progress:25,cover:"violet",niches:"Editing / Photography,JJ & Trends,Kpop / Dance / Concert",brief:"Tampilkan transformasi edit video yang satisfying dengan motion before-and-after.",referenceLink:"https://www.tiktok.com/tag/beforeafter",tutorialLink:"https://wink.meitu.com/",startsAt:"2026-08-05"},
];

export const submissions: Submission[] = [
  {id:"SUB-8914",creator:"Nadia Prameswari",task:"Summer Glow Retouch",product:"Meitu",platform:"TikTok",views:182400,aiViews:181970,totalEngagement:10554,analyticsStatus:"AI extracted",recommendation:"Qualified",confidence:96,status:"In review",submitted:"Today, 10:42",avatar:"NP",postUrl:"https://www.tiktok.com/@nadiaspace",publishedAt:"2026-08-03",submittedAt:"2026-08-05T10:42:00Z",engagementRate:5.8,whatsapp:"628111234567"},
  {id:"SUB-8913",creator:"Gita Ayu",task:"One-Tap Portrait Studio",product:"BeautyCam",platform:"Instagram",views:74400,aiViews:70210,totalEngagement:491,analyticsStatus:"AI extracted",recommendation:"Not Qualified",confidence:78,status:"In review",submitted:"Today, 09:18",avatar:"GA",postUrl:"https://www.instagram.com/gitglow",publishedAt:"2026-08-02",submittedAt:"2026-08-05T09:18:00Z",engagementRate:.7,whatsapp:"628121234567"},
  {id:"SUB-8912",creator:"Fajar Malik",task:"Before / After Motion",product:"Wink",platform:"TikTok",views:318000,aiViews:317860,totalEngagement:22886,analyticsStatus:"AI extracted",recommendation:"Qualified",confidence:91,status:"In review",submitted:"Yesterday",avatar:"FM",postUrl:"https://www.tiktok.com/@fajarmotion",publishedAt:"2026-07-30",submittedAt:"2026-08-04T14:00:00Z",engagementRate:7.2,whatsapp:"628131234567"},
  {id:"SUB-8911",creator:"Salsa Nabila",task:"Summer Glow Retouch",product:"Meitu",platform:"TikTok",views:246900,aiViews:247100,totalEngagement:15814,analyticsStatus:"AI extracted",recommendation:"Qualified",confidence:98,status:"Qualified",submitted:"Yesterday",avatar:"SN",postUrl:"https://www.tiktok.com/@salsaglow",publishedAt:"2026-08-01",submittedAt:"2026-08-04T12:00:00Z",engagementRate:6.4,whatsapp:"628141234567"},
];

export const rewards: Reward[] = [
  {id:"RWD-5501",creator:"Salsa Nabila",task:"Summer Glow Retouch",product:"Meitu",views:247100,type:"Cash",amount:1250000,status:"In Payment",submissionId:"SUB-8911",paymentFormChecked:1},
  {id:"RWD-5500",creator:"Nadia Prameswari",task:"Beauty Basics",product:"BeautyCam",views:126800,type:"Cash",amount:500000,status:"Fully Paid",submissionId:"SUB-8800",paymentFormChecked:1,paidAt:"2026-08-03T10:00:00Z"},
  {id:"RWD-5499",creator:"Fajar Malik",task:"Motion Magic",product:"Wink",views:511400,type:"Cash",amount:2500000,status:"Fully Paid",submissionId:"SUB-8799",paymentFormChecked:1,paidAt:"2026-08-02T10:00:00Z"},
];

export const streakRequests: StreakRequest[] = [
  {id:"STR-1042",creator:"Nadia Prameswari",completedTasks:10,selectedApp:"BeautyCam",status:"In review",submitted:"2026-08-05T08:30:00Z"},
];

export const paymentForms: PaymentForm[] = [
  {id:"PAYFORM-Meitu-2026-08",product:"Meitu",month:"2026-08",url:"https://titan-h5.meitu.com/app/starlight/kol-collection/index.html#/?p=TWVpdHU6NDA2"},
  {id:"PAYFORM-BeautyCam-2026-08",product:"BeautyCam",month:"2026-08",url:"https://titan-h5.meitu.com/app/starlight/kol-collection/index.html#/?p=QmVhdXR5Q2FtOjQwOA=="},
  {id:"PAYFORM-Wink-2026-08",product:"Wink",month:"2026-08",url:"https://titan-h5.meitu.com/app/starlight/kol-collection/index.html#/?p=V2luazo0MTA="},
];

export const creatorProfiles: CreatorProfile[] = [
  {id:"PROFILE-salsa-nabila",creator:"Salsa Nabila",displayName:"Salsa Nabila",contactEmail:"salsa@example.com",niches:"Beauty,Lifestyle,Fashion",tiktokUrl:"https://www.tiktok.com/@salsaglow",instagramUrl:"https://www.instagram.com/salsanabila",threadsUrl:"https://www.threads.net/@salsaglow",whatsapp:"628141234567"},
];

export const leaderboard = [
  {rank:1,name:"Salsa Nabila",handle:"@salsaglow",views:"2.8M",posts:12,trend:"+18%",initials:"SN"},
  {rank:2,name:"Fajar Malik",handle:"@fajarmotion",views:"2.2M",posts:9,trend:"+31%",initials:"FM"},
  {rank:3,name:"Nadia Prameswari",handle:"@nadiaspace",views:"1.9M",posts:11,trend:"+12%",initials:"NP"},
  {rank:4,name:"Gita Ayu",handle:"@gitaglow",views:"1.4M",posts:8,trend:"+24%",initials:"GA"},
];

export const fmtIdr = (value:number) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(value);
export const fmtNum = (value:number) => new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:1}).format(value);
