/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import Matter from "matter-js";
import { 
  ArrowUpRight, 
  ChevronRight,
  Monitor,
  Cpu,
  Palette,
  BookOpen,
  Layout,
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Check
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

// --- Types ---

interface PortfolioMedia {
  url: string;
  type: 'image' | 'video';
  poster?: string;
}

interface PortfolioItem {
  id: number;
  title: string;
  image: string;
  images: PortfolioMedia[];
  coverVariant?: 'limi-brand';
  coverPosition?: 'center' | 'top';
}

interface Project {
  id: string;
  title: string;
  description: string;
  link: string;
  icon: React.ReactNode;
  tags: string[];
  image: string;
}

// --- Data ---

const PROJECTS: Project[] = [
  {
    id: "vibe-coding",
    title: "品牌项目",
    description: "品牌、包装、IP，涵盖品牌策划、视觉设计与创意落地的全案合集。",
    link: "https://vibecodingfang.netlify.app/",
    icon: <Cpu className="w-5 h-5" />,
    tags: ["品牌策划", "视觉设计", "全案设计"],
    image: "/images/design-portfolio-cover.png"
  },
  {
    id: "ai-inspiration",
    title: "AI 视觉灵感",
    description: "未来设计师的AI提示词库，涵盖品牌、包装、IP、海报、插画与视频。",
    link: "https://aivisionsone.netlify.app/",
    icon: <Palette className="w-5 h-5" />,
    tags: ["AI资源", "提示词", "视觉设计"],
    image: "/images/ai-inspiration-cover.png"
  },
  {
    id: "win95",
    title: "Image 2.5 本地无限画布部署与使用",
    description: "未来设计师自定义视觉工作流，利用无限画布创建更多灵感。",
    link: "/seedance-guide/seedance-guide.html",
    icon: <Monitor className="w-5 h-5" />,
    tags: ["工作流", "效率工具", "设计探索"],
    image: "/images/image-canvas-cover.png"
  },
  {
    id: "design-challenge",
    title: "内容创作",
    description: "在治愈的文字中，不断地找到自我，努力寻找自己的价值。",
    link: "https://writiewords.netlify.app/",
    icon: <BookOpen className="w-5 h-5" />,
    tags: ["创作", "生活", "感悟"],
    image: "/images/content-creation-cover.png"
  },
];

const SELECTED_WORK_PROJECTS: Project[] = [
  {
    id: "selected-video",
    title: "视频创作",
    description: "静态变动态才更有趣，未来的生活方式",
    link: "#",
    icon: <Palette className="w-5 h-5" />,
    tags: ["视频", "动画", "视觉延展"],
    image: "/images/video-portfolio-cover.png"
  },
  {
    id: "selected-xiaomi",
    title: "本地无限画布自由创作",
    description: "参考多种无限画布，基于未来AI设计师/自由创作者使用习惯而创建",
    link: "https://artlabai.netlify.app/",
    icon: <Layout className="w-5 h-5" />,
    tags: ["未来", "创作", "ai"],
    image: "/images/xiaomi-artlab-cover.png"
  }
];

const TRAIL_IMAGES = [
  "/images/trail/trail-extra-01.png",
  "/images/trail/trail-extra-02.png",
  "/images/trail/trail-extra-03.png",
  "/images/trail/trail-extra-07.png",
  "/images/trail/trail-extra-08.png",
  "/images/trail/trail-extra-09.png",
  "/images/trail/trail-extra-11.png",
  "/images/trail/trail-extra-12.png",
  "/images/trail/trail-extra-13.png",
  "/images/trail/trail-extra-14.png",
  "/images/trail/trail-extra-15.png",
  "/images/trail/trail-extra-16.png",
  "/images/trail/trail-01.webp",
  "/images/trail/trail-04.webp",
  "/images/trail/trail-05.webp",
  "/images/trail/trail-09.webp",
  "/images/trail/trail-10.webp",
  "/images/trail/trail-11.webp",
  "/images/trail/trail-12.webp",
];

const PORTFOLIO_STORAGE_KEY = 'kacey-portfolio-items';
const VIDEO_PROJECT_STORAGE_KEY = 'kacey-video-project';
const VIDEO_PROJECTS_STORAGE_KEY = 'kacey-video-projects';
const VIDEO_HOME_COVER = '/images/video-portfolio-cover.png';

const createVideoPoster = (file: File) =>
  new Promise<Blob | null>((resolve, reject) => {
    const video = document.createElement('video');
    const source = URL.createObjectURL(file);
    video.preload = 'metadata';
    video.muted = true;
    video.src = source;

    const cleanup = () => URL.revokeObjectURL(source);
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(7, Math.max(0, video.duration - 0.1));
    };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) {
        cleanup();
        resolve(null);
        return;
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        cleanup();
        resolve(blob);
      }, 'image/jpeg', 0.88);
    };
    video.onerror = () => {
      cleanup();
      reject(new Error(`Unable to read video: ${file.name}`));
    };
  });

const loadVideoProject = (): PortfolioItem => {
  const fallback: PortfolioItem = {
    id: -1,
    title: '视频创作',
    image: VIDEO_HOME_COVER,
    images: []
  };

  const savedVideo = window.localStorage.getItem(VIDEO_PROJECT_STORAGE_KEY);
  try {
    if (savedVideo) {
      const project = JSON.parse(savedVideo) as PortfolioItem;
      if (project.images.length) return project;
    }

    const savedPortfolio = window.localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (savedPortfolio) {
      const items = JSON.parse(savedPortfolio) as PortfolioItem[];
      const videos = items.flatMap(item => item.images.filter(media => media.type === 'video'));
      if (videos.length) {
        return {
          ...fallback,
          image: videos[0].poster ?? fallback.image,
          images: videos,
        };
      }
    }
  } catch (error) {
    console.error('Failed to restore video project:', error);
  }

  return fallback;
};

const loadVideoProjects = (): PortfolioItem[] => {
  try {
    const saved = window.localStorage.getItem(VIDEO_PROJECTS_STORAGE_KEY);
    if (saved) return JSON.parse(saved) as PortfolioItem[];
    const legacy = loadVideoProject();
    return legacy.images.length ? [legacy] : [];
  } catch (error) {
    console.error('Failed to restore video projects:', error);
    return [];
  }
};

const fileToBase64 = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const uploadLocalFile = async (file: Blob, fileName: string) => {
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName,
      data: await fileToBase64(file),
    }),
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  const result = await response.json() as { url: string };
  return result.url;
};

const wuhanFoodFestivalProject = (): PortfolioItem => ({
  id: 7,
  title: "武汉美食节",
  image: "/images/wuhan-food-festival-cover.png",
  coverPosition: 'top',
  images: [
    { url: "/images/wuhan-food-festival-cover.png", type: 'image' },
    { url: "/uploads/1789721112943-_34.png", type: 'image' },
    { url: "/uploads/1789721113632-_35.png", type: 'image' },
    { url: "/uploads/1789721364450-_37.png", type: 'image' }
  ]
});

const syncPortfolioCover = (item: PortfolioItem): PortfolioItem => ({
  ...item,
  image: item.images[0]?.url ?? item.image,
});

const normalizePortfolioItems = (items: PortfolioItem[]) => {
  const normalizedItems = items
    .filter(item => !['花园精灵 IP 设计', 'XIAOMI 品牌周边设计'].includes(item.title))
    .map(item => {
      const images = item.images.filter(media => !media.url.startsWith('blob:'));

    if (item.title === 'NEW PROJECT' || item.title === 'New Project') {
      const coverUrl = '/images/wuhan-food-festival-cover.png';
      return syncPortfolioCover({
        ...item,
        title: '武汉美食节',
        coverPosition: 'top' as const,
        images: [
          { url: coverUrl, type: 'image' as const },
          ...images.filter(media => media.url !== coverUrl),
        ],
      });
    }

    return syncPortfolioCover({
      ...item,
      images,
    });
  });

  if (normalizedItems.some(item => item.title === '武汉美食节')) {
    return normalizedItems;
  }

  return [...normalizedItems, wuhanFoodFestivalProject()];
};

interface TrailItem {
  id: number;
  x: number;
  y: number;
  url: string;
  rotation: number;
}

const MouseTrail = () => {
  const [trail, setTrail] = useState<TrailItem[]>([]);
  const lastPos = useRef({ x: 0, y: 0 });
  const indexRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const workSection = document.getElementById('work');
      if (workSection) {
        const workTop = workSection.offsetTop;
        const mouseAbsY = window.scrollY + e.clientY;
        if (mouseAbsY > workTop - 90) return;
      }

      const distance = Math.hypot(e.clientX - lastPos.current.x, e.clientY - lastPos.current.y);
      
      if (distance > 100) {
        lastPos.current = { x: e.clientX, y: e.clientY };
        const newItem: TrailItem = {
          id: Date.now(),
          x: e.clientX,
          y: e.clientY,
          url: TRAIL_IMAGES[indexRef.current % TRAIL_IMAGES.length],
          rotation: Math.random() * 20 - 10
        };
        
        indexRef.current++;
        setTrail(prev => [...prev.slice(-12), newItem]);

        // Auto-remove after 0.6 seconds if mouse is still
        setTimeout(() => {
          setTrail(prev => prev.filter(t => t.id !== newItem.id));
        }, 600);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      <AnimatePresence>
        {trail.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.5, x: item.x - 75, y: item.y - 51, rotate: item.rotation }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ 
              opacity: 0, 
              scale: 0.2, 
              rotate: item.rotation + 45,
              transition: { duration: 0.5, ease: "easeOut" }
            }}
            className="absolute rounded-[6px] overflow-hidden shadow-2xl"
            style={{ width: '150px' }}
          >
            <img src={item.url} className="block w-full h-auto" alt="" referrerPolicy="no-referrer" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// --- Components ---

const Navbar = ({ 
  currentPage, 
  setCurrentPage, 
  lang, 
  setLang,
  setSelectedProject,
}: { 
  currentPage: 'home' | 'design-portfolio' | 'video-portfolio' | 'about'; 
  setCurrentPage: (page: 'home' | 'design-portfolio' | 'video-portfolio' | 'about') => void;
  lang: 'en' | 'zh';
  setLang: (l: 'en' | 'zh') => void;
  setSelectedProject: (proj: PortfolioItem | null) => void;
}) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
      <div className="w-full px-[clamp(72px,4.2vw,100px)] h-20 flex items-center justify-between">
        <button 
          onClick={() => {
            setSelectedProject(null);
            setCurrentPage('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} 
          className="text-xs font-medium tracking-tight hover:opacity-70 transition-opacity uppercase cursor-none" 
          style={{ fontSize: '12px' }}
        >
          KACEY
        </button>
        <div className="flex items-center gap-12 text-[12px] font-medium uppercase tracking-normal" style={{ fontSize: '12px' }}>
          <button 
            onClick={() => {
              setSelectedProject(null);
              setCurrentPage('home');
              setTimeout(() => {
                const el = document.getElementById('work');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 120);
            }} 
            className={`hover:text-white transition-colors cursor-none ${currentPage === 'home' ? 'text-white font-semibold' : 'text-white/40'}`}
          >
            {lang === 'zh' ? '作品' : 'Work'}
          </button>
          <button 
            onClick={() => {
              setSelectedProject(null);
              setCurrentPage('about');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className={`hover:text-white transition-colors cursor-none ${currentPage === 'about' ? 'text-white font-semibold' : 'text-white/40'}`}
          >
            {lang === 'zh' ? '关于' : 'About'}
          </button>
          <button 
            onClick={() => {
              setSelectedProject(null);
              setCurrentPage('about');
              setTimeout(() => {
                const el = document.getElementById('contact');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 120);
            }} 
            className="hover:text-white transition-colors cursor-none text-white/40"
          >
            {lang === 'zh' ? '联系' : 'Contact'}
          </button>
        </div>
        <div className="text-[12px] font-medium uppercase tracking-tight" style={{ fontSize: '12px' }}>
          <button 
            onClick={() => setLang('en')} 
            className={`hover:text-white transition-colors cursor-none ${lang === 'en' ? 'text-white font-semibold' : 'text-white/40'}`}
          >
            EN
          </button>
          <span className="mx-2 text-white/10">|</span>
          <button 
            onClick={() => setLang('zh')} 
            className={`hover:text-white transition-colors cursor-none ${lang === 'zh' ? 'text-white font-semibold' : 'text-white/40'}`}
          >
            中文
          </button>
        </div>
      </div>
    </nav>
  );
};

interface ProjectCardProps {
  project: Project;
  index: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick?: () => void;
  key?: string | number;
}

const ProjectCard = ({ project, index, onMouseEnter, onMouseLeave, onClick }: ProjectCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <a 
        href={onClick ? "#" : project.link} 
        target={(!onClick && (project.link.startsWith('http') || project.link.startsWith('file:'))) ? "_blank" : "_self"}
        rel="noopener noreferrer"
        className="block cursor-none"
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick();
          } else if (project.link === '#') {
            e.preventDefault();
          }
        }}
      >
        <div 
          className="aspect-[16/9] overflow-hidden relative rounded-[18px] bg-black transition-all duration-500"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <img 
            src={project.image} 
            alt={project.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 ease-out ${project.id === 'selected-video' || project.id === 'selected-xiaomi' ? 'object-top' : ''}`}
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="mt-[24px] flex flex-col">
          <div className="flex justify-between items-end mb-[12px]">
            <h3 className="text-2xl font-medium tracking-tight text-white uppercase">
              {project.title}
            </h3>
            <div className="p-2 border border-white/10 rounded-full group-hover:bg-white group-hover:text-black transition-all">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-white/80 text-[13px] leading-relaxed mb-[12px] font-medium max-w-sm">
            {project.description}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {project.tags.map(tag => (
              <span key={tag} className="px-4 py-1.5 bg-white/5 text-[9px] font-bold uppercase tracking-widest rounded-full border border-white/5 text-white/40 group-hover:border-white/10 transition-colors">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </a>
    </motion.div>
  );
};

const CustomCursor = ({ isVisible }: { isVisible: boolean }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <motion.div
      animate={{ 
        x: mousePos.x - (isVisible ? 45 : 6), 
        y: mousePos.y - (isVisible ? 45 : 6),
        width: isVisible ? 90 : 12,
        height: isVisible ? 90 : 12,
      }}
      transition={{ type: "spring", damping: 30, stiffness: 350, mass: 0.8 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-300 ${
        isVisible 
          ? "bg-white/10 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.36),inset_0_0_10px_rgba(255,255,255,0.2)]" 
          : "bg-white"
      }`}>
        <motion.div
          animate={{ 
            opacity: isVisible ? 1 : 0,
            scale: isVisible ? 1 : 0,
            rotate: isVisible ? 0 : -45
          }}
        >
          {isVisible && <ArrowUpRight className="w-10 h-10 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" strokeWidth={2.5} />}
        </motion.div>
      </div>
    </motion.div>
  );
};

const Hero = () => {
  return (
    <section className="h-screen flex items-center px-[clamp(72px,4.2vw,100px)]">
      <div className="max-w-7xl mx-auto text-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center"
        >
          <h1 
            className="font-medium mb-[60px] uppercase tracking-normal"
            style={{ fontSize: 'min(120px, 12vw)', lineHeight: '120px' }}
          >
            KACEY <br /> PORTFOLIO.
          </h1>
          <div className="max-w-3xl mx-auto">
            <p className="text-[12px] text-white font-medium tracking-normal uppercase" style={{ fontSize: '12px', lineHeight: '24px' }}>
              hello, I am Kuang Lixia, a visual designer and content creator <br className="hidden md:block" /> who focuses on exploring the practical application of AI.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const FallingText = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<{ id: number; text: string; highlight: boolean; x: number; y: number; angle: number; width: number; height: number }[]>([]);
  const engineRef = useRef<Matter.Engine | null>(null);
  const itemsRef = useRef<{ [key: number]: Matter.Body }>({});
  const requestRef = useRef<number | null>(null);
  const [isInView, setIsInView] = useState(false);

  const words = [
    { text: "I" }, { text: "am" }, { text: "a" },
    { text: "graphic designer", highlight: true },
    { text: "with" }, { text: "ten" }, { text: "years" }, { text: "of" }, { text: "experience," },
    { text: "as" }, { text: "well" }, { text: "as" }, { text: "a" },
    { text: "content creator", highlight: true },
    { text: "on" }, { text: "Xiaohongshu" }, { text: "and" },
    { text: "WeChat" }, { text: "Official" }, { text: "Accounts," },
    { text: "covering" }, 
    { text: "brand", highlight: true }, 
    { text: "planning," },
    { text: "product" }, 
    { text: "packaging", highlight: true },
    { text: "design," }, 
    { text: "event" }, { text: "marketing," },
    { text: "and" }, 
    { text: "IP", highlight: true }, 
    { text: "design." },
    { text: "I" }, { text: "have" }, { text: "experience" }, { text: "in" },
    { text: "building" }, 
    { text: "brands", highlight: true },
    { text: "from" }, { text: "scratch." },
    { text: "Currently," }, { text: "I" }, { text: "am" }, { text: "exploring" },
    { text: "the" }, { text: "practical" }, { text: "applications" }, { text: "of" },
    { text: "AI", highlight: true },
    { text: "," },
    { text: "and" }, { text: "I" }, { text: "have" }, { text: "used" },
    { text: "VIBE CODEX", highlight: true },
    { text: "," },
    { text: "Google AI Studio", highlight: true },
    { text: "," },
    { text: "GPT", highlight: true },
    { text: "," },
    { text: "Midjourney", highlight: true },
    { text: "," },
    { text: "Liblib", highlight: true },
    { text: "," },
    { text: "Lovirt", highlight: true },
    { text: "," },
    { text: "and" }, 
    { text: "Jimeng", highlight: true },
    { text: "." },
    { text: "I" }, { text: "also" }, { text: "build" }, { text: "some" },
    { text: "AI", highlight: true },
    { text: "intelligent" }, { text: "agent" },
    { text: "workflows" }, { text: "myself." },
    { text: "I" }, { text: "mainly" }, { text: "live" }, { text: "in" },
    { text: "Chongqing" }, { text: "and" }, { text: "hope" }, { text: "to" },
    { text: "find" }, { text: "like-minded" }, { text: "partners." }
  ];

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = Matter.Engine.create({
      gravity: { y: 1.2 }
    });
    engineRef.current = engine;
    const world = engine.world;

    const updateDimensions = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      // Remove existing static boundaries if any
      const bodies = Matter.Composite.allBodies(world);
      const staticBoundaries = bodies.filter(b => b.label === 'boundary');
      Matter.Composite.remove(world, staticBoundaries);
      
      const ground = Matter.Bodies.rectangle(width / 2, height + 50, width, 100, { isStatic: true, label: 'boundary' });
      const leftWall = Matter.Bodies.rectangle(-20, height / 2, 100, height * 10, { isStatic: true, label: 'boundary' });
      const rightWall = Matter.Bodies.rectangle(width + 20, height / 2, 100, height * 10, { isStatic: true, label: 'boundary' });
      
      Matter.Composite.add(world, [ground, leftWall, rightWall]);
    };

    updateDimensions();

    // Mouse constraint for dragging
    const mouse = Matter.Mouse.create(containerRef.current);
    
    // CRITICAL: Ensure page scrolling works
    // Matter.js often prevents default on wheel/touch events. 
    // We explicitly remove its internal handlers for those.
    // @ts-ignore
    if (mouse.mousewheel) mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
    // @ts-ignore
    if (mouse.mousewheel) mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
    // @ts-ignore
    if (mouse.mousewheel) mouse.element.removeEventListener("wheel", mouse.mousewheel);
    
    // Important: Allow touch scrolling while allowing mouse interaction
    containerRef.current.style.touchAction = 'pan-y';

    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.1, // Softer drag
        render: { visible: false }
      }
    });
    Matter.Composite.add(world, mouseConstraint);

    const update = () => {
      Matter.Engine.update(engine, 1000 / 60);
      
      const bodies = Matter.Composite.allBodies(world);
      
      // Extra force ONLY when actively dragging
      if (mouseConstraint.body) {
        const draggingBody = mouseConstraint.body;
        bodies.forEach(body => {
          if (body === draggingBody || body.isStatic) return;
          const dx = body.position.x - draggingBody.position.x;
          const dy = body.position.y - draggingBody.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const forceMagnitude = (1 - dist / 100) * 0.01;
            Matter.Body.applyForce(body, body.position, {
              x: dx * forceMagnitude,
              y: dy * forceMagnitude - 0.002
            });
          }
        });
      }

      setItems(prev => prev.map(item => {
        const body = itemsRef.current[item.id];
        if (!body) return item;

        return {
          ...item,
          x: body.position.x,
          y: body.position.y,
          angle: body.angle
        };
      }));

      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
      }
    }, { threshold: 0.1 });

    observer.observe(containerRef.current);

    window.addEventListener('resize', updateDimensions);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      Matter.Engine.clear(engine);
      observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  useEffect(() => {
    if (isInView && engineRef.current && items.length === 0) {
      const width = containerRef.current?.clientWidth || 800;
      
      const newItems = words.map((w, i) => {
        const id = i;
        const charCount = w.text.length;
        const isEnglish = /[a-zA-Z]/.test(w.text);
        
        // Compact sizing
        const itemWidth = isEnglish ? (charCount * 14 + 15) : (charCount * 28 + 10);
        const itemHeight = 45;
        
        const x = Math.random() * (width - 200) + 100;
        const y = -100 - (i * 25); // Faster, more concentrated drop
        
        const body = Matter.Bodies.rectangle(x, y, itemWidth, itemHeight, {
          restitution: 0.1,
          friction: 0.1,
          frictionAir: 0.015,
          angle: (Math.random() - 0.5) * 0.3,
          density: 0.001
        });

        itemsRef.current[id] = body;
        Matter.Composite.add(engineRef.current!.world, body);

        return {
          id,
          text: w.text,
          highlight: w.highlight || false,
          x,
          y,
          angle: body.angle,
          width: itemWidth,
          height: itemHeight
        };
      });

      setItems(newItems);
    }
  }, [isInView]);

  return (
    <section 
      ref={containerRef}
      className="relative w-full h-[80vh] bg-black overflow-hidden select-none"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={`absolute flex items-center justify-center rounded-sm tracking-tighter whitespace-nowrap transition-transform duration-75 ${item.highlight ? 'text-[#F26A21] font-bold' : 'text-white/70 hover:text-white font-medium'}`}
          style={{
            left: 0,
            top: 0,
            width: item.width,
            height: item.height,
            transform: `translate(${item.x - item.width / 2}px, ${item.y - item.height / 2}px) rotate(${item.angle}rad)`,
            fontSize: item.highlight ? 'calc(min(1.875rem, 6vw) + 5px)' : 'calc(min(1.875rem, 6vw) + 2px)', 
            willChange: 'transform text-shadow',
            textShadow: item.highlight ? '0 0 15px rgba(182,237,240,0.4)' : 'none',
            cursor: 'grab'
          }}
        >
          {item.text}
        </div>
      ))}

      {/* End of simulation */}
    </section>
  );
};

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [isHoveringWork, setIsHoveringWork] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'design-portfolio' | 'video-portfolio' | 'about'>('home');
  const [lang, setLang] = useState<'en' | 'zh'>('zh');
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);
  
  useEffect(() => {
    setMounted(true);
    if (currentPage !== 'home') {
      window.scrollTo(0, 0);
    }
  }, [currentPage]);

  // Admin Mode States
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [videoProjects, setVideoProjects] = useState<PortfolioItem[]>(loadVideoProjects);

  const isVideoPortfolioPage = currentPage === 'video-portfolio';

  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(() => {
    const defaultItems: PortfolioItem[] = [
    { 
      id: 1, 
      title: "项目名称 01", 
      image: "https://images.unsplash.com/photo-1634942537034-222a613d961e?q=80&w=1000&auto=format&fit=crop",
      images: [
        { url: "https://images.unsplash.com/photo-1634942537034-222a613d961e?q=80&w=1200&auto=format&fit=crop", type: 'image' },
        { url: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=1200&auto=format&fit=crop", type: 'image' },
        { url: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?q=80&w=1200&auto=format&fit=crop", type: 'image' }
      ]
    },
    { 
      id: 2, 
      title: "项目名称 02", 
      image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=1000&auto=format&fit=crop",
      images: [
        { url: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=1200&auto=format&fit=crop", type: 'image' },
        { url: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1200&auto=format&fit=crop", type: 'image' },
        { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop", type: 'image' }
      ]
    },
    { 
      id: 3, 
      title: "项目名称 03", 
      image: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?q=80&w=1000&auto=format&fit=crop",
      images: [
        { url: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?q=80&w=1200&auto=format&fit=crop", type: 'image' },
        { url: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1200&auto=format&fit=crop", type: 'image' },
        { url: "https://images.unsplash.com/photo-1545235617-9465d2a55698?q=80&w=1200&auto=format&fit=crop", type: 'image' }
      ]
    },
    { 
      id: 4, 
      title: "项目名称 04", 
      image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop",
      images: [
        { url: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1200&auto=format&fit=crop", type: 'image' },
        { url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop", type: 'image' },
        { url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop", type: 'image' }
      ]
    },
    { 
      id: 5, 
      title: "荔蜜品牌升级", 
      image: "/images/limi-brand-upgrade-cover.png",
      coverVariant: 'limi-brand',
      images: [
        { url: "/images/limi-brand-upgrade-cover.png", type: 'image' },
        { url: "https://images.unsplash.com/photo-1511433662265-63e9f3513191?q=80&w=1200&auto=format&fit=crop", type: 'image' },
        { url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop", type: 'image' }
      ]
    },
    { 
      id: 6, 
      title: "IP形象设计", 
      image: "/images/ip-character-design-cover.png",
      images: [
        { url: "/images/ip-character-design-cover.png", type: 'image' },
        { url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=1200&auto=format&fit=crop", type: 'image' },
        { url: "https://images.unsplash.com/photo-1493421419110-74f4e85ba124?q=80&w=1200&auto=format&fit=crop", type: 'image' }
      ]
    },
    {
      id: 7,
      title: "武汉美食节",
      image: "/images/wuhan-food-festival-cover.png",
      coverPosition: 'top',
      images: [
        { url: "/images/wuhan-food-festival-cover.png", type: 'image' },
        { url: "/uploads/1789721112943-_34.png", type: 'image' },
        { url: "/uploads/1789721113632-_35.png", type: 'image' },
        { url: "/uploads/1789721364450-_37.png", type: 'image' }
      ]
    },
  ];

    const savedItems = window.localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (!savedItems) {
      return normalizePortfolioItems(defaultItems);
    }

    try {
      return normalizePortfolioItems(JSON.parse(savedItems) as PortfolioItem[]);
    } catch (error) {
      console.error('Failed to restore portfolio items:', error);
      return normalizePortfolioItems(defaultItems);
    }
  });

  const activePortfolioItems = isVideoPortfolioPage ? videoProjects : portfolioItems;

  useEffect(() => {
    window.localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(normalizePortfolioItems(portfolioItems)));
  }, [portfolioItems]);

  useEffect(() => {
    window.localStorage.setItem(VIDEO_PROJECTS_STORAGE_KEY, JSON.stringify(videoProjects));
    window.localStorage.setItem(VIDEO_PROJECT_STORAGE_KEY, JSON.stringify(videoProjects[0] ?? loadVideoProject()));
    if (selectedProject && videoProjects.some(project => project.id === selectedProject.id)) {
      setSelectedProject(videoProjects.find(project => project.id === selectedProject.id) ?? null);
    }
  }, [videoProjects]);

  const handleTitleClick = () => {
    if (!isVideoPortfolioPage || isAdminMode) return;

    const now = Date.now();
    if (now - lastClickTime < 1000) {
      const newCount = adminClickCount + 1;
      setAdminClickCount(newCount);
      if (newCount >= 4) {
        setIsAdminMode(true);
        setAdminClickCount(0);
      }
    } else {
      setAdminClickCount(1);
    }
    setLastClickTime(now);
  };

  const deleteProject = (id: number) => {
    setPortfolioItems(prev => prev.filter(item => item.id !== id));
  };

  const moveImage = (projectIdx: number, imgIdx: number, direction: 'up' | 'down') => {
    if (isVideoProject) {
      setVideoProjects(prev => {
        const project = prev[projectIdx];
        if (!project) return prev;
        const images = [...project.images];
        const targetIdx = direction === 'up' ? imgIdx - 1 : imgIdx + 1;
        if (targetIdx < 0 || targetIdx >= images.length) return prev;
        [images[imgIdx], images[targetIdx]] = [images[targetIdx], images[imgIdx]];
        const next = { ...project, images, image: images[0]?.poster ?? project.image };
        setSelectedProject(next);
        return prev.map(item => item.id === next.id ? next : item);
      });
      return;
    }

    setPortfolioItems(prev => {
      const newItems = [...prev];
      const project = { ...newItems[projectIdx] };
      const images = [...project.images];
      const targetIdx = direction === 'up' ? imgIdx - 1 : imgIdx + 1;
      
      if (targetIdx < 0 || targetIdx >= images.length) return prev;
      
      [images[imgIdx], images[targetIdx]] = [images[targetIdx], images[imgIdx]];
      project.images = images;
      newItems[projectIdx] = syncPortfolioCover(project);
      
      // Also update selectedProject if currently viewing it
      if (selectedProject && selectedProject.id === project.id) {
        setSelectedProject(newItems[projectIdx]);
      }
      
      return newItems;
    });
  };

  const deleteImage = (projectIdx: number, imgIdx: number) => {
    if (isVideoProject) {
      setVideoProjects(prev => {
        const project = prev[projectIdx];
        if (!project) return prev;
        const images = project.images.filter((_, i) => i !== imgIdx);
        const next = { ...project, images, image: images[0]?.poster ?? project.image };
        setSelectedProject(next);
        return prev.map(item => item.id === next.id ? next : item);
      });
      return;
    }

    setPortfolioItems(prev => {
      const newItems = [...prev];
      const project = { ...newItems[projectIdx] };
      const images = project.images.filter((_, i) => i !== imgIdx);
      project.images = images;
      newItems[projectIdx] = syncPortfolioCover(project);
      
      if (selectedProject && selectedProject.id === project.id) {
        setSelectedProject(newItems[projectIdx]);
      }
      
      return newItems;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, projectIdx: number) => {
    const files = e.target.files;
    if (!files) return;

    const newMedia: PortfolioMedia[] = [];

    // Import pdfjs dynamically
    const pdfjs = await import('pdfjs-dist');
    // Using a reliable worker URL
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.type.startsWith('video/')) {
        const url = await uploadLocalFile(file, file.name);
        newMedia.push({ url, type: 'video' });
      } else if (file.type === 'application/pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            if (context) {
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              
              await page.render({ 
                canvasContext: context, 
                viewport,
                //@ts-ignore - fix for types discrepancy in different pdfjs versions
                canvas: canvas 
              }).promise;
              
              const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
              if (blob) {
                const url = await uploadLocalFile(blob, `${file.name.replace(/\.pdf$/i, '')}-page-${pageNum}.jpg`);
                newMedia.push({ url, type: 'image' });
              }
            }
          }
        } catch (err) {
          console.error("PDF processing failed:", err);
        }
      } else {
        // Image or GIF
        const url = await uploadLocalFile(file, file.name);
        newMedia.push({ url, type: 'image' });
      }
    }

    setPortfolioItems(prev => {
      const newItems = [...prev];
      const project = { ...newItems[projectIdx] };
      project.images = [...project.images, ...newMedia];
      newItems[projectIdx] = syncPortfolioCover(project);
      
      if (selectedProject && selectedProject.id === project.id) {
        setSelectedProject(newItems[projectIdx]);
      }
      
      return newItems;
    });
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = (Array.from(e.target.files ?? []) as File[]).filter(file => file.type.startsWith('video/'));
    if (!files.length) return;

    const newMedia: PortfolioMedia[] = [];
    for (const file of files) {
      const [videoUrl, posterBlob] = await Promise.all([
        uploadLocalFile(file, file.name),
        createVideoPoster(file),
      ]);
      const poster = posterBlob
        ? await uploadLocalFile(posterBlob, `${file.name.replace(/\.[^.]+$/, '')}-7s.jpg`)
        : undefined;
      newMedia.push({ url: videoUrl, type: 'video', poster });
    }

    setVideoProjects(prev => prev.map(project => {
      if (project.id !== selectedProject?.id) return project;
      const images = [...project.images, ...newMedia];
      const next = { ...project, image: images[0]?.poster ?? project.image, images };
      setSelectedProject(next);
      return next;
    }));
    e.target.value = '';
  };

  const addProject = () => {
    if (isVideoPortfolioPage) {
      setVideoProjects(prev => [...prev, {
        id: -Date.now(),
        title: '视频创作',
        image: VIDEO_HOME_COVER,
        images: [],
      }]);
      return;
    }

    const newProject: PortfolioItem = {
      id: Date.now(),
      title: "New Project",
      image: "https://images.unsplash.com/photo-1545235617-9465d2a55698?q=80&w=1000&auto=format&fit=crop",
      images: []
    };
    setPortfolioItems(prev => [...prev, newProject]);
  };

  const isVideoProject = selectedProject?.id < 0;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased selection:bg-white selection:text-black cursor-none">
      <Navbar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        lang={lang} 
        setLang={setLang}
        setSelectedProject={setSelectedProject}
      />
      {currentPage === 'home' && <MouseTrail />}
      <CustomCursor isVisible={isHoveringWork} />
      
      <AnimatePresence mode="wait">
        {currentPage === 'home' && (
          <motion.main 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pt-[30px]"
          >
            <Hero />
            
            <section id="work" className="pb-12 bg-black mt-[36px]">
              <div className="w-full px-[clamp(72px,4.2vw,100px)]">
                <div className="mb-9">
                  <h2 className="font-medium tracking-normal text-white" style={{ fontSize: 'min(72px, 9vw)' }}>
                    Selected work
                  </h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-x-9 gap-y-[54px]">
                  {[...PROJECTS, ...SELECTED_WORK_PROJECTS].map((project, index) => (
                    <ProjectCard 
                      key={project.id}
                      project={project.id === 'selected-video' ? { ...project, image: VIDEO_HOME_COVER } : project} 
                      index={index} 
                      onMouseEnter={() => setIsHoveringWork(true)}
                      onMouseLeave={() => setIsHoveringWork(false)}
                      onClick={project.id === 'vibe-coding' ? () => {
                        setIsHoveringWork(false);
                        setCurrentPage('design-portfolio');
                      } : project.id === 'selected-video' ? () => {
                        setIsHoveringWork(false);
                        setCurrentPage('video-portfolio');
                      } : undefined}
                    />
                  ))}
                </div>
              </div>
            </section>

            <FallingText />
          </motion.main>
        )}

        {(currentPage === 'design-portfolio' || currentPage === 'video-portfolio') && (
          <motion.main 
            key="portfolio"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="pt-[140px] pb-0"
            onMouseEnter={() => setIsHoveringWork(false)}
          >
            <div className="w-full px-[clamp(72px,4.2vw,100px)] pb-24">
              <div className="mb-4">
                <button 
                  onClick={() => {
                    setIsHoveringWork(false);
                    setCurrentPage('home');
                  }}
                  className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-widest text-white/40 hover:text-white transition-colors group cursor-none"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back
                </button>
              </div>
              
              <div className="mb-9 flex items-center justify-between">
                <h2 
                  onClick={handleTitleClick}
                  className={`font-medium tracking-normal text-white select-none ${isAdminMode ? 'cursor-default' : 'cursor-pointer'}`} 
                  style={{ fontSize: 'min(72px, 9vw)' }}
                >
                  {isVideoPortfolioPage ? 'Video portfolio' : 'Design portfolio'}
                </h2>
                {isAdminMode && (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setIsAdminMode(false)}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#B6EDF0] transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Finish
                  </motion.button>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-x-9 gap-y-[54px]">
                {isAdminMode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="aspect-[16/9] border-2 border-dashed border-white/20 rounded-[18px] flex flex-col items-center justify-center gap-4 hover:border-white/40 transition-colors cursor-pointer group"
                    onClick={addProject}
                  >
                    <div className="p-4 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors">
                      <Plus className="w-8 h-8 text-white/40 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-[12px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Add New Project</span>
                  </motion.div>
                )}
                {activePortfolioItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="group relative"
                  >
                    {isAdminMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isVideoPortfolioPage) {
                            setVideoProjects(prev => prev.filter(project => project.id !== item.id));
                            if (selectedProject?.id === item.id) setSelectedProject(null);
                          } else {
                            deleteProject(item.id);
                          }
                        }}
                        className="absolute -top-3 -right-3 z-20 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 cursor-pointer shadow-lg"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    )}
                    <div 
                      className="aspect-[16/9] overflow-hidden relative rounded-[18px] bg-white/5 transition-all duration-500 cursor-pointer"
                      onClick={() => {
                        setIsHoveringWork(false);
                        setSelectedProject(item);
                      }}
                    >
                      {item.coverVariant === 'limi-brand' ? (
                        <div className="limi-cover relative h-full w-full overflow-hidden">
                          <div className="limi-cover-bg absolute inset-0" />
                          <div className="relative z-[1] flex h-full flex-col justify-center px-[9%] text-[#26343d]">
                            <p className="text-[clamp(18px,3.9vw,56px)] font-light leading-none text-[#4b5660]">Brand Upgrade</p>
                            <div className="relative mt-[5%] w-fit">
                              <div className="absolute bottom-[8%] left-[12%] h-[28%] w-[72%] rounded-[4px] bg-gradient-to-r from-[#119fa4]/70 to-[#c271d8]/80" />
                              <p className="relative text-[clamp(24px,5vw,72px)] font-bold leading-none text-[#3f4a51]">System.</p>
                            </div>
                            <div className="mt-[7%] text-[clamp(12px,2.1vw,32px)] font-semibold leading-none tracking-tight">荔蜜品牌升级2.0</div>
                            <div className="mt-[4%] flex items-center gap-[4%] text-[clamp(9px,1.55vw,24px)] font-medium leading-none">
                              <span className="h-px w-[14%] bg-[#26343d]" />
                              <span>医美咨询平台</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 ease-out opacity-80 ${item.coverPosition === 'top' ? 'object-top' : ''}`}
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <div className="mt-[24px]">
                      <h3 
                        className="text-2xl font-medium tracking-tight text-white uppercase flex items-center justify-between cursor-pointer"
                        onClick={() => {
                          setIsHoveringWork(false);
                          setSelectedProject(item);
                        }}
                      >
                        {isAdminMode ? (
                          <input 
                            type="text" 
                            value={item.title}
                            onChange={(e) => {
                              if (isVideoPortfolioPage) {
                                setVideoProjects(prev => prev.map(project => project.id === item.id
                                  ? { ...project, title: e.target.value }
                                  : project));
                              } else {
                                const newItems = [...portfolioItems];
                                newItems[index].title = e.target.value;
                                setPortfolioItems(newItems);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-transparent border-b border-white/20 focus:border-white outline-none w-full mr-4"
                          />
                        ) : item.title}
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="mt-24">
              <FallingText />
            </div>
          </motion.main>
        )}

        {currentPage === 'about' && (
          <motion.main 
            key="about"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="pt-[140px] pb-0 font-sans"
            onMouseEnter={() => setIsHoveringWork(false)}
          >
            <div className="max-w-3xl mx-auto px-6 pb-24">
              {/* Back breadcrumb */}
              <div className="mb-12">
                <button 
                  onClick={() => {
                    setIsHoveringWork(false);
                    setCurrentPage('home');
                  }}
                  className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-widest text-white/40 hover:text-white transition-colors group cursor-none"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  {lang === 'zh' ? '返回首页' : 'Back'}
                </button>
              </div>

              {/* Profile Intro / Header Section */}
              <div className="mb-16">
                <h1 className="text-5xl font-medium tracking-tight text-white mb-6 font-sans">
                  {lang === 'zh' ? 'Kacey。' : 'Kacey.'}
                </h1>
                <p className="text-lg md:text-xl text-white/80 leading-relaxed font-normal tracking-wide">
                  {lang === 'zh' ? (
                    "匡丽霞，资深品牌设计师，具备 10 年品牌与视觉设计经验。擅长从业务目标、品牌定位、用户洞察和竞品分析出发，搭建 LOGO/VI/IP、包装、电商与活动视觉体系；同时持续实践 AI 产品与 Codex 工具开发，把可复用流程沉淀为 Skill，提升内容与设计交付效率。"
                  ) : (
                    "Lixia Kuang is a senior brand designer with 10 years of experience in brand and visual design. She works from business goals, brand positioning, user insight, and competitor research to build logo/VI/IP, packaging, e-commerce, and campaign visual systems. She also practices AI product workflows and Codex tool development, turning repeatable processes into Skills that improve content and design delivery."
                  )}
                </p>
              </div>

              {/* Divider */}
              <div className="h-[1px] bg-white/10 my-12" />

              {/* 核心能力 / Core Strengths */}
              <div className="mb-20">
                <h2 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-10 font-mono font-semibold" style={{ fontSize: '11px' }}>
                  {lang === 'zh' ? '核心能力' : 'Core Strengths'}
                </h2>
                
                <div className="space-y-12">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">
                      {lang === 'zh' ? '品牌从 0 到 1 搭建' : 'Brand Building from 0 to 1'}
                    </h3>
                    <p className="text-[14px] text-white/50 leading-relaxed max-w-2xl">
                      {lang === 'zh' ? (
                        "能从品牌定位、市场趋势、用户画像和竞品分析中提炼视觉方向，完成 LOGO、VI、IP、包装、电商视觉与活动物料的系统搭建，让品牌形象保持一致、可识别、可延展。"
                      ) : (
                        "Define visual direction from brand positioning, market trends, audience profiles, and competitor research. Build logo, VI, IP, packaging, e-commerce, and campaign assets into a consistent, recognizable, and scalable brand system."
                      )}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">
                      {lang === 'zh' ? '业务转化导向的视觉设计' : 'Business-Oriented Visual Design'}
                    </h3>
                    <p className="text-[14px] text-white/50 leading-relaxed max-w-2xl">
                      {lang === 'zh' ? (
                        "设计判断不只停留在审美层面，会结合销售目标、渠道场景、用户复购、页面转化和活动传播效果，输出能支持业务增长的包装、电商详情页、主图、banner 与线下物料。"
                      ) : (
                        "Make design decisions beyond aesthetics by connecting sales goals, channel context, repeat purchase, page conversion, and campaign reach. Deliver packaging, detail pages, key visuals, banners, and offline materials that support business growth."
                      )}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">
                      {lang === 'zh' ? 'AI 设计提效与工具化能力' : 'AI Efficiency & Tool-Making'}
                    </h3>
                    <p className="text-[14px] text-white/50 leading-relaxed max-w-2xl">
                      {lang === 'zh' ? (
                        "熟悉 Midjourney、Stable Diffusion、ComfyUI、Codex 与 Google AI Studio。能把真实创作需求拆成流程、功能和工具，并通过生图网站、Writing helper Skill 等实践降低交付成本、缩短制作周期。"
                      ) : (
                        "Experienced with Midjourney, Stable Diffusion, ComfyUI, Codex, and Google AI Studio. Break real creative needs into workflows, features, and tools, using projects such as an image-generation website and Writing helper Skill to reduce delivery cost and production time."
                      )}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">
                      {lang === 'zh' ? '自驱动学习与跨界执行力' : 'Self-Driven Learning & Execution'}
                    </h3>
                    <p className="text-[14px] text-white/50 leading-relaxed max-w-2xl">
                      {lang === 'zh' ? (
                        "从品牌设计延伸到 AI 产品研究、内容运营、开源 Skill 与个人网站开发，保持对新工具和新方法的高敏感度；能主动学习、快速验证，并把经验转化为可复用的工作方法。"
                      ) : (
                        "Extend from brand design into AI product research, content operations, open-source Skills, and personal website development. Stay sensitive to new tools, learn quickly, validate ideas, and turn experience into repeatable working methods."
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-[1px] bg-white/10 my-12" />

              {/* 工作与项目 / Work & Projects */}
              <div className="mb-20">
                <h2 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-10 font-mono font-semibold" style={{ fontSize: '11px' }}>
                  {lang === 'zh' ? '工作与项目' : 'Work & Projects'}
                </h2>

                <div className="space-y-14">
                  {/* Item 1 */}
                  <div className="border-l border-white/10 pl-6 space-y-3">
                    <div className="text-xs font-mono font-semibold text-[#B6EDF0]" style={{ fontSize: '11px' }}>2026.01 — {lang === 'zh' ? '至今' : 'Present'}</div>
                    <h3 className="text-lg font-medium text-white">
                      {lang === 'zh' ? '全栈设计师 / AI 产品研究与创作' : 'Full-Stack Designer / AI Product Research & Creation'}
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed">
                      {lang === 'zh' ? (
                        "围绕设计师真实创作需求，使用 Codex 与 Google AI Studio 开发生图网站和个人网站，完成需求定义、功能梳理、交互流程与本地验证；将公众号写作方法沉淀为开源 Writing helper Skill，体现快速学习、产品思维与闭环执行能力。"
                      ) : (
                        "Build image-generation and personal websites with Codex and Google AI Studio around real designer needs, covering requirements, feature structure, interaction flow, and local validation. Turn WeChat writing methods into an open-source Writing helper Skill, showing product thinking, fast learning, and closed-loop execution."
                      )}
                    </p>
                  </div>

                  {/* Item 2 */}
                  <div className="border-l border-white/10 pl-6 space-y-3">
                    <div className="text-xs font-mono font-semibold text-[#B6EDF0]" style={{ fontSize: '11px' }}>2020.06 — 2025.12</div>
                    <h3 className="text-lg font-medium text-white">
                      {lang === 'zh' ? '设计工作室 / 品牌设计师' : 'Design Studio / Brand Designer'}
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed">
                      {lang === 'zh' ? (
                        "负责品牌活动创意、节日营销包装、电商主图与详情页设计，围绕销售目标和用户复购优化视觉表达；搭建品牌资产体系提升识别度与一致性，并引入 Stable Diffusion、ComfyUI 缩短交付周期、降低外包成本。"
                      ) : (
                        "Handled brand campaign concepts, seasonal packaging, e-commerce key visuals, and detail pages, optimizing visual expression around sales goals and repeat purchase. Built brand assets for stronger recognition and consistency, while introducing Stable Diffusion and ComfyUI to shorten delivery cycles and reduce outsourcing costs."
                      )}
                    </p>
                  </div>

                  {/* Item 3 */}
                  <div className="border-l border-white/10 pl-6 space-y-3">
                    <div className="text-xs font-mono font-semibold text-[#B6EDF0]" style={{ fontSize: '11px' }}>2018.07 — 2020.04</div>
                    <h3 className="text-lg font-medium text-white">
                      {lang === 'zh' ? '重庆任我在线科技服务有限公司 / 资深品牌设计师' : 'Chongqing Renwo Online Technology Service Co., Ltd. / Senior Brand Designer'}
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed">
                      {lang === 'zh' ? (
                        "主导公司品牌 LOGO 与 VI 系统设计，协助制定品牌传播策略，提炼超级符号提升市场辨识度；负责线上线下活动物料、小程序详情页、头图与 banner，通过竞品分析优化页面表达与用户转化。"
                      ) : (
                        "Led company logo and VI system design, supported brand communication strategy, and refined signature brand symbols to improve market recognition. Created online/offline campaign assets, mini-program detail pages, hero images, and banners, using competitor analysis to improve page expression and conversion."
                      )}
                    </p>
                  </div>

                  {/* Item 4 */}
                  <div className="border-l border-white/10 pl-6 space-y-3">
                    <div className="text-xs font-mono font-semibold text-[#B6EDF0]" style={{ fontSize: '11px' }}>2015.04 — 2018.05</div>
                    <h3 className="text-lg font-medium text-white">
                      {lang === 'zh' ? '重庆玛格家居有限公司 / 品牌设计师' : 'Chongqing Macio Home Furnishing Co., Ltd. / Brand Designer'}
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed">
                      {lang === 'zh' ? (
                        "负责家居产品包装画册、线上线下活动视觉方案与品牌物料设计。结合目标消费者特征、产品定位与竞品趋势设定视觉风格，让设计同时服务品牌形象、营销策略与用户偏好。"
                      ) : (
                        "Designed home product packaging brochures, online/offline campaign visuals, and brand assets. Shaped visual direction through audience insight, product positioning, and competitor trends so design could support brand image, marketing strategy, and user preference."
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-[1px] bg-white/10 my-12" />

              {/* 创作与反响 / Creation & Resonance */}
              <div className="mb-20">
                <h2 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-10 font-mono font-semibold" style={{ fontSize: '11px' }}>
                  {lang === 'zh' ? '创作与反响' : 'Creation & Resonance'}
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Creation Item 1 */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-colors relative flex flex-col justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">
                        {lang === 'zh' ? 'Image 2.5 本地无限画布部署与使用' : 'Image 2 Local Infinite Canvas Deployment & Usage'}
                      </h4>
                      <p className="text-[13px] text-white/40 leading-relaxed mb-6">
                        {lang === 'zh' ? (
                          "设计师自己的本地生图生视频无限画布，在不依赖平台的作用下，自己可以本地部署并使用。"
                        ) : (
                          "Detailed blueprint for designers to coordinate with AI tools, transforming beautiful visual screens into production-ready platforms."
                        )}
                      </p>
                    </div>
                    {/* Stats */}
                    <div className="flex justify-between border-t border-white/5 pt-4 text-xs font-mono text-white/40">
                      <div><span className="font-semibold text-[#B6EDF0]">2.8w</span> {lang === 'zh' ? '浏览' : 'Views'}</div>
                      <div><span className="font-semibold text-white/80">372</span> {lang === 'zh' ? '点赞' : 'Likes'}</div>
                      <div><span className="font-semibold text-white/80">60</span> {lang === 'zh' ? '分享' : 'Shares'}</div>
                    </div>
                  </div>

                  {/* Creation Item 2 */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-colors relative flex flex-col justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">
                        {lang === 'zh' ? 'AI 视觉设计提示词库' : 'AI Visual Prompts Hub'}
                      </h4>
                      <p className="text-[13px] text-white/40 leading-relaxed mb-6">
                        {lang === 'zh' ? (
                          "精选整理适合品牌、包装、海报及漫画插图的 AI 生图高层级提示词规范，提供可以直接复用的可读范例，帮助成千上万同行完成日常极速提效。"
                        ) : (
                          "Curated prompt library covering branding, product shells, and illustrations, extensively shared inside major design forums."
                        )}
                      </p>
                    </div>
                    {/* Stats */}
                    <div className="flex justify-between border-t border-white/5 pt-4 text-xs font-mono text-white/40">
                      <div><span className="font-semibold text-[#B6EDF0]">5.4w</span> {lang === 'zh' ? '浏览' : 'Views'}</div>
                      <div><span className="font-semibold text-white/80">933</span> {lang === 'zh' ? '点赞' : 'Likes'}</div>
                      <div><span className="font-semibold text-white/80">132</span> {lang === 'zh' ? '分享' : 'Shares'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-[1px] bg-white/10 my-12" />

              {/* 联系 / Contact */}
              <div id="contact" className="scroll-mt-32">
                <h2 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-10 font-mono font-semibold" style={{ fontSize: '11px' }}>
                  {lang === 'zh' ? '联系' : 'CONTACT'}
                </h2>

                <div className="flex flex-col md:flex-row gap-12 items-start justify-between">
                  {/* Left Column: Contact Rows with horizontals */}
                  <div className="w-full md:w-[65%] border-t border-white/10">
                    {/* Row 1 - Email */}
                    <a 
                      href="mailto:kuanglijun9@163.com"
                      className="grid grid-cols-12 items-center py-7 border-b border-white/10 group cursor-none hover:bg-white/[0.01] px-1 transition-colors duration-300"
                    >
                      <div className="col-span-3 text-xs font-sans text-white/40 uppercase tracking-[0.15em] font-medium">EMAIL</div>
                      <div className="col-span-8 text-base font-sans text-white/90 group-hover:text-white transition-colors">kuanglijun9@163.com</div>
                      <div className="col-span-1 flex justify-end">
                        <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                      </div>
                    </a>

                    {/* Row 2 - Phone */}
                    <a 
                      href="tel:15215035364"
                      className="grid grid-cols-12 items-center py-7 border-b border-white/10 group cursor-none hover:bg-white/[0.01] px-1 transition-colors duration-300"
                    >
                      <div className="col-span-3 text-xs font-sans text-white/40 uppercase tracking-[0.15em] font-medium">PHONE</div>
                      <div className="col-span-8 text-base font-sans text-white/90 group-hover:text-white transition-colors">152 1503 5364</div>
                      <div className="col-span-1 flex justify-end">
                        <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                      </div>
                    </a>
                  </div>

                  {/* Right Column: WeChat QR Code card */}
                  <div className="w-full md:w-[28%] flex flex-col items-center justify-center md:items-end mt-4 md:mt-0">
                    <div className="flex flex-col items-center">
                      <div className="w-[170px] h-[170px] bg-white p-[14px] rounded-[20px] shadow-lg flex items-center justify-center select-none overflow-hidden hover:scale-[1.02] transition-transform duration-500">
                        <img src="/images/wechat-qr.png" alt="微信二维码" className="w-full h-full object-contain" />
                        <svg width="142" height="142" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
                          {/* Corner Position Detection Pattern (Big Finder Squares) */}
                          {/* Top Left */}
                          <rect x="0" y="0" width="28" height="28" fill="black" rx="3" />
                          <rect x="4" y="4" width="20" height="20" fill="white" rx="1" />
                          <rect x="8" y="8" width="12" height="12" fill="black" rx="1" />

                          {/* Top Right */}
                          <rect x="112" y="0" width="28" height="28" fill="black" rx="3" />
                          <rect x="116" y="4" width="20" height="20" fill="white" rx="1" />
                          <rect x="120" y="8" width="12" height="12" fill="black" rx="1" />

                          {/* Bottom Left */}
                          <rect x="0" y="112" width="28" height="28" fill="black" rx="3" />
                          <rect x="4" y="116" width="20" height="20" fill="white" rx="1" />
                          <rect x="8" y="120" width="12" height="12" fill="black" rx="1" />

                          {/* Alignment Pattern */}
                          <rect x="108" y="108" width="12" height="12" fill="black" rx="1" />
                          <rect x="112" y="112" width="4" height="4" fill="white" />
                          
                          {/* Timing patterns and dense random QR-like structures */}
                          <rect x="36" y="8" width="4" height="4" fill="black" />
                          <rect x="44" y="8" width="4" height="4" fill="black" />
                          <rect x="52" y="8" width="8" height="4" fill="black" />
                          <rect x="68" y="8" width="4" height="4" fill="black" />
                          <rect x="80" y="8" width="12" height="4" fill="black" />
                          <rect x="96" y="8" width="4" height="4" fill="black" />
                          
                          <rect x="36" y="16" width="12" height="4" fill="black" />
                          <rect x="56" y="16" width="4" height="4" fill="black" />
                          <rect x="64" y="16" width="8" height="4" fill="black" />
                          <rect x="76" y="16" width="4" height="4" fill="black" />
                          <rect x="88" y="16" width="8" height="4" fill="black" />
                          
                          <rect x="36" y="24" width="4" height="4" fill="black" />
                          <rect x="48" y="24" width="8" height="4" fill="black" />
                          <rect x="60" y="24" width="4" height="4" fill="black" />
                          <rect x="72" y="24" width="12" height="4" fill="black" />
                          <rect x="92" y="24" width="4" height="4" fill="black" />
                          
                          <rect x="8" y="36" width="4" height="4" fill="black" />
                          <rect x="16" y="36" width="4" height="4" fill="black" />
                          <rect x="24" y="36" width="4" height="4" fill="black" />
                          <rect x="36" y="36" width="8" height="4" fill="black" />
                          <rect x="52" y="36" width="12" height="4" fill="black" />
                          <rect x="72" y="36" width="4" height="4" fill="black" />
                          <rect x="84" y="36" width="16" height="4" fill="black" />
                          <rect x="108" y="36" width="4" height="4" fill="black" />
                          <rect x="116" y="36" width="4" height="4" fill="black" />
                          <rect x="124" y="36" width="8" height="4" fill="black" />

                          <rect x="0" y="44" width="8" height="4" fill="black" />
                          <rect x="12" y="44" width="4" height="4" fill="black" />
                          <rect x="24" y="44" width="4" height="4" fill="black" />
                          <rect x="40" y="44" width="4" height="4" fill="black" />
                          <rect x="60" y="44" width="8" height="4" fill="black" />
                          <rect x="76" y="44" width="4" height="4" fill="black" />
                          <rect x="84" y="44" width="12" height="4" fill="black" />
                          <rect x="104" y="44" width="8" height="4" fill="black" />
                          <rect x="120" y="44" width="12" height="4" fill="black" />

                          <rect x="8" y="52" width="4" height="4" fill="black" />
                          <rect x="16" y="52" width="12" height="4" fill="black" />
                          <rect x="32" y="52" width="4" height="4" fill="black" />
                          <rect x="44" y="52" width="8" height="4" fill="black" />
                          <rect x="72" y="52" width="4" height="4" fill="black" />
                          <rect x="88" y="52" width="8" height="4" fill="black" />
                          <rect x="100" y="52" width="12" height="4" fill="black" />
                          <rect x="124" y="52" width="4" height="4" fill="black" />

                          <rect x="0" y="60" width="12" height="4" fill="black" />
                          <rect x="20" y="60" width="4" height="4" fill="black" />
                          <rect x="28" y="60" width="8" height="4" fill="black" />
                          <rect x="40" y="60" width="12" height="4" fill="black" />
                          <rect x="80" y="60" width="4" height="4" fill="black" />
                          <rect x="92" y="60" width="16" height="4" fill="black" />
                          <rect x="116" y="60" width="4" height="4" fill="black" />
                          <rect x="128" y="60" width="8" height="4" fill="black" />

                          <rect x="8" y="68" width="4" height="4" fill="black" />
                          <rect x="24" y="68" width="16" height="4" fill="black" />
                          <rect x="96" y="68" width="12" height="4" fill="black" />
                          <rect x="112" y="68" width="4" height="4" fill="black" />
                          <rect x="120" y="68" width="8" height="4" fill="black" />

                          <rect x="0" y="76" width="12" height="4" fill="black" />
                          <rect x="16" y="76" width="4" height="4" fill="black" />
                          <rect x="32" y="76" width="8" height="4" fill="black" />
                          <rect x="96" y="76" width="8" height="4" fill="black" />
                          <rect x="108" y="76" width="4" height="4" fill="black" />
                          <rect x="120" y="76" width="16" height="4" fill="black" />

                          <rect x="12" y="84" width="16" height="4" fill="black" />
                          <rect x="36" y="84" width="4" height="4" fill="black" />
                          <rect x="44" y="84" width="4" height="4" fill="black" />
                          <rect x="92" y="84" width="12" height="4" fill="black" />
                          <rect x="112" y="84" width="4" height="4" fill="black" />
                          <rect x="128" y="84" width="4" height="4" fill="black" />

                          <rect x="36" y="92" width="12" height="4" fill="black" />
                          <rect x="52" y="92" width="4" height="4" fill="black" />
                          <rect x="60" y="92" width="16" height="4" fill="black" />
                          <rect x="80" y="92" width="8" height="4" fill="black" />
                          <rect x="96" y="92" width="4" height="4" fill="black" />
                          <rect x="104" y="92" width="12" height="4" fill="black" />
                          <rect x="120" y="92" width="8" height="4" fill="black" />

                          <rect x="36" y="100" width="8" height="4" fill="black" />
                          <rect x="48" y="100" width="16" height="4" fill="black" />
                          <rect x="68" y="100" width="4" height="4" fill="black" />
                          <rect x="76" y="100" width="12" height="4" fill="black" />
                          <rect x="92" y="100" width="4" height="4" fill="black" />
                          <rect x="104" y="100" width="4" height="4" fill="black" />
                          <rect x="112" y="100" width="16" height="4" fill="black" />

                          <rect x="36" y="108" width="4" height="4" fill="black" />
                          <rect x="44" y="108" width="12" height="4" fill="black" />
                          <rect x="64" y="108" width="4" height="4" fill="black" />
                          <rect x="80" y="108" width="8" height="4" fill="black" />
                          <rect x="96" y="108" width="12" height="4" fill="black" />

                          <rect x="36" y="116" width="16" height="4" fill="black" />
                          <rect x="56" y="116" width="4" height="4" fill="black" />
                          <rect x="64" y="116" width="12" height="4" fill="black" />
                          <rect x="84" y="116" width="4" height="4" fill="black" />
                          <rect x="92" y="116" width="8" height="4" fill="black" />

                          <rect x="36" y="124" width="4" height="4" fill="black" />
                          <rect x="44" y="124" width="8" height="4" fill="black" />
                          <rect x="56" y="124" width="4" height="4" fill="black" />
                          <rect x="72" y="124" width="12" height="4" fill="black" />
                          <rect x="88" y="124" width="4" height="4" fill="black" />

                          <rect x="36" y="132" width="12" height="4" fill="black" />
                          <rect x="52" y="132" width="8" height="4" fill="black" />
                          <rect x="68" y="132" width="16" height="4" fill="black" />
                          <rect x="88" y="132" width="8" height="4" fill="black" />

                          {/* Central WeChat Logo container */}
                          <rect x="52" y="52" width="36" height="36" fill="white" rx="4" />
                          <rect x="55" y="55" width="30" height="30" fill="black" rx="3" />
                          
                          {/* WeChat Double Bubble Vector Icons inside the black badge */}
                          <path d="M62.5 73c0-2.4 2.2-4.2 5-4.2s5 1.8 5 4.2c0 2.4-2.2 4.2-5 4.2c-.6 0-1.1-.1-1.6-.3l-1.8.9c-.2.1-.4 0-.3-.2l.5-1.7c-1.1-.8-1.8-1.8-1.8-2.9zm3.5-1c0-.4-.4-.7-.8-.7s-.8.3-.8.7s.4.7.8.7s.8-.3.8-.7zm3.2 0c0-.4-.4-.7-.8-.7s-.8.3-.8.7s.4.7.8.7s.8-.3.8-.7z" fill="white" />
                          <path d="M72.5 71c0-1.8-1.8-3.2-4-3.2c-.8 0-1.5.1-2.2.4c.5.8.7 1.6.7 2.5c0 2.2-1.8 4-4 4c-.2 0-.5 0-.7-.1c.6 1.4 2.2 2.4 4.2 2.4c.5 0 .9-.1 1.3-.2l1.6.8c.1.1.3 0 .2-.1l-.4-1.5c1.4-.7 2.3-1.6 2.3-2.6zm-5-1c0-.3-.3-.6-.6-.6c-.3 0-.6.3-.6.6c0 .3.3.6.6.6c.3 0 .6-.3.6-.6zm2.8 0c0-.3-.3-.6-.6-.6c-.4 0-.6.3-.6.6c0 .3.3.6.6.6c.2 0 .6-.3.6-.6z" fill="white" />
                          </svg>
                      </div>
                      <div className="text-xs text-white/40 mt-3 text-center tracking-[0.2em]">
                        {lang === 'zh' ? '微信' : 'WECHAT'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-20 text-center">
                  <button 
                    onClick={() => {
                      setIsHoveringWork(false);
                      setCurrentPage('home');
                    }}
                    className="text-xs font-semibold uppercase tracking-widest text-white/40 hover:text-white transition-colors cursor-none border border-white/10 rounded-full px-8 py-4 bg-white/5 hover:bg-white/10"
                  >
                    {lang === 'zh' ? '返回首页' : 'Back to Home'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-24">
              <FallingText />
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black overflow-y-auto cursor-default"
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSelectedProject(null)}
              className="fixed top-8 right-8 z-[110] p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white transition-all group pointer-events-auto"
            >
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </motion.button>

            <div className="w-full">
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="w-full px-[clamp(72px,4.2vw,100px)] pt-32 pb-16"
              >
                {isAdminMode && (
                  <div className="mb-12 flex justify-between items-center bg-white/5 p-6 rounded-2xl backdrop-blur-md sticky top-24 z-30 border border-white/10">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-[#B6EDF0]">Editing Project</h4>
                      <p className="text-xs text-white/40 mt-1">Changes are saved automatically to local state.</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsAdminMode(false);
                        setSelectedProject(null);
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#B6EDF0] transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Finish & Exit Admin
                    </button>
                  </div>
                )}
                <div className="flex flex-col gap-[12px]">
                  {selectedProject.images.map((media: PortfolioMedia | string, idx: number) => {
                    const projectIdx = isVideoProject
                      ? videoProjects.findIndex(p => p.id === selectedProject.id)
                      : portfolioItems.findIndex(p => p.id === selectedProject.id);
                    const mediaObj = typeof media === 'string' ? { url: media, type: 'image' as const } : media;
                    
                    return (
                      <motion.div
                        key={`${selectedProject.id}-${idx}`}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full overflow-hidden bg-white/5 relative group/img"
                      >
                        {isAdminMode && (
                          <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => moveImage(projectIdx, idx, 'up')}
                                disabled={idx === 0}
                                className="p-2 bg-black/60 text-white rounded-md hover:bg-white hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => moveImage(projectIdx, idx, 'down')}
                                disabled={idx === selectedProject.images.length - 1}
                                className="p-2 bg-black/60 text-white rounded-md hover:bg-white hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => deleteImage(projectIdx, idx)}
                              className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-xl"
                            >
                              <X className="w-6 h-6" />
                            </button>
                          </div>
                        )}
                        {mediaObj.type === 'video' ? (
                          <video 
                            src={mediaObj.url} 
                            poster={mediaObj.poster}
                            controls 
                            className="w-full h-auto"
                            autoPlay
                            muted
                            loop
                          />
                        ) : (
                          <img 
                            src={mediaObj.url} 
                            alt={`${selectedProject.title} detail ${idx + 1}`}
                            className="w-full h-auto object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </motion.div>
                    );
                  })}

                  {isAdminMode && (
                    <div className="mt-8 border-2 border-dashed border-white/20 rounded-[24px] p-12 flex flex-col items-center justify-center gap-6 hover:border-white/40 transition-all group relative">
                      <div className="p-6 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors">
                        <Upload className="w-10 h-10 text-white/40 group-hover:text-white transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-medium text-white mb-2">
                          {isVideoProject ? 'Upload videos' : 'Upload images, videos or PDFs'}
                        </p>
                        <p className="text-sm text-white/40">
                          {isVideoProject ? 'Each video uses its 7-second frame as the cover' : 'Images, GIFs, Videos, or PDFs supported'}
                        </p>
                      </div>
                      <input 
                        type="file" 
                        multiple 
                        accept={isVideoProject ? 'video/*' : 'image/*,video/*,application/pdf'}
                        onChange={(e) => isVideoProject
                          ? handleVideoUpload(e)
                          : handleFileUpload(e, portfolioItems.findIndex(p => p.id === selectedProject.id))}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
