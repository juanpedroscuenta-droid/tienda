import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Zap, ArrowRight, ShoppingBag } from "lucide-react";
import { fetchProducts as fetchProductsApi } from "@/lib/api";
import { Product } from "@/contexts/CartContext";
import { ProductCard } from "./ProductCard";
import { useNavigate } from "react-router-dom";
import { ProductCardSkeleton } from "./ProductCardSkeleton";

export const NewProductsCarousel: React.FC = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const totalSegments = 3;

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const response = await fetchProductsApi();
                const published = response.products.filter(p => (p as any).is_published !== false);

                // Shuffle to show a varied selection
                const shuffled = [...published].sort(() => Math.random() - 0.5);
                setProducts(shuffled.slice(0, 10));
            } catch (err) {
                console.error("Error fetching newest products", err);
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
    }, []);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const scrollLeft = container.scrollLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;

        if (maxScroll <= 0) return;

        const progress = scrollLeft / maxScroll;
        const currentSegment = Math.min(
            totalSegments - 1,
            Math.floor(progress * totalSegments + 0.1)
        );
        setActiveIndex(currentSegment);
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [products]);

    // Autoplay logic replicated from Similar Products
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || products.length === 0) return;

        (container as any).lastInteraction = Date.now();
        const handleInteraction = () => {
            (container as any).lastInteraction = Date.now();
        };

        container.addEventListener('touchstart', handleInteraction);
        container.addEventListener('mousedown', handleInteraction);

        const interval = setInterval(() => {
            const now = Date.now();
            const lastInt = (container as any).lastInteraction || 0;
            if (now - lastInt >= 5000) {
                const maxScroll = container.scrollWidth - container.clientWidth;
                if (maxScroll > 10) {
                    if (container.scrollLeft >= maxScroll - 20) {
                        container.scrollTo({ left: 0, behavior: 'smooth' });
                    } else {
                        container.scrollBy({ left: container.clientWidth / 1.5, behavior: 'smooth' });
                    }
                }
            }
        }, 5000);

        return () => {
            clearInterval(interval);
            container.removeEventListener('touchstart', handleInteraction);
            container.removeEventListener('mousedown', handleInteraction);
        };
    }, [products.length]);

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            const width = scrollContainerRef.current.clientWidth;
            scrollContainerRef.current.scrollBy({ left: -width, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            const width = scrollContainerRef.current.clientWidth;
            scrollContainerRef.current.scrollBy({ left: width, behavior: 'smooth' });
        }
    };

    const jumpToSegment = (index: number) => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const maxScroll = container.scrollWidth - container.clientWidth;
            const targetScroll = (index / (totalSegments - 1)) * maxScroll;
            container.scrollTo({ left: targetScroll, behavior: 'smooth' });
        }
    };

    if (loading || (products.length === 0 && loading)) {
        return (
            <div className="bg-white w-full mb-16 pt-8 animate-pulse">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
                    <div className="flex flex-col lg:flex-row gap-8 items-stretch">
                        <div className="w-full lg:w-[280px] bg-gray-50 rounded-xl h-[400px]" />
                        <div className="flex-1 flex gap-4 overflow-hidden">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex-[0_0_46%] sm:flex-[0_0_45%] lg:flex-[0_0_31%]">
                                    <ProductCardSkeleton />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (products.length === 0 && !loading) {
        return null;
    }

    return (
        <div className="bg-white w-full mb-16 pt-8">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
                <div className="flex flex-col lg:flex-row gap-8 items-stretch">

                    {/* New Products Banner - Integrated Style */}
                    <div className="w-full lg:w-[280px] flex-shrink-0 flex flex-col items-center justify-center p-0 text-center relative pointer-events-none">
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">

                            {/* Slanted Tag */}
                            <div className="relative z-10">
                                <div className="bg-[#E2343E] px-4 py-1.5 transform -rotate-3 mb-2 shadow-sm ring-1 ring-black/5">
                                    <span className="text-[10px] font-black uppercase tracking-tight text-white">
                                        Autopartes
                                    </span>
                                </div>
                            </div>

                            {/* MAIN CONTENT */}
                            <div className="relative mt-2">
                                <Zap className="absolute -top-6 -left-8 text-[#E2343E] w-10 h-10 fill-current animate-pulse" />
                                <h2 className="text-4xl font-[900] text-black leading-[0.8] tracking-tighter transform -rotate-2">Y REPUESTOS</h2>
                                <h2 className="text-4xl font-[900] text-black leading-[0.8] tracking-tighter transform -rotate-2 mt-1">GENÉRICOS /</h2>
                                <h2 className="text-6xl font-[900] text-[#1a1a1a] leading-[0.8] tracking-tighter transform rotate-1 mt-1 uppercase">Homologados</h2>
                                <Zap className="absolute -bottom-6 -right-8 text-[#E2343E] w-10 h-10 fill-current animate-pulse delay-150" />
                            </div>

                            {/* RECIEN LLEGADOS BAR */}
                            <div className="mt-6 bg-[#E2343E] w-full py-2.5 px-4 transform -rotate-1 shadow-md border-b-4 border-black/10">
                                <span className="text-[10px] font-black text-white uppercase tracking-tight leading-tight block">
                                    Variedad de manijas, plumillas, pines y repuestos para todas las marcas
                                </span>
                            </div>

                            {/* VER TODO BUTTON */}
                            <button
                                onClick={() => navigate('/nuevos')}
                                className="mt-6 md:mt-10 bg-[#2d2d2d] text-white flex items-center justify-center gap-3 px-6 md:px-10 py-3 md:py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.1em] hover:bg-black transition-all shadow-xl pointer-events-auto"
                            >
                                <ArrowRight className="w-4 h-4" />
                                Ver todo
                            </button>
                        </div>
                    </div>

                    {/* Carousel Section */}
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="relative group/carousel flex items-center h-full">

                            {/* Navigation Arrows Style Replicated */}
                            <button
                                onClick={scrollLeft}
                                className="absolute left-0 top-1/2 -translate-y-1/2 lg:-left-4 z-40 bg-[#E2343E] text-white p-2 shadow-lg hover:bg-[#c42831] transition-all flex items-center justify-center rounded-sm"
                            >
                                <ChevronLeft className="h-5 w-5" strokeWidth={3} />
                            </button>

                            {/* SCROLL TRACK */}
                            <div
                                ref={scrollContainerRef}
                                className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-6 pt-2 w-full"
                            >
                                {products.map(product => (
                                    <div
                                        key={product.id}
                                        className="flex-[0_0_80%] sm:flex-[0_0_45%] lg:flex-[0_0_31%] min-w-0 shrink-0"
                                    >
                                        <div className="h-full rounded-2xl transition-all bg-white hover:shadow-xl hover:shadow-orange-500/5 group/pcard">
                                            <ProductCard product={product} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={scrollRight}
                                className="absolute right-0 top-1/2 -translate-y-1/2 lg:-right-4 z-40 bg-[#E2343E] text-white p-2 shadow-lg hover:bg-[#c42831] transition-all flex items-center justify-center rounded-sm"
                            >
                                <ChevronRight className="h-5 w-5" strokeWidth={3} />
                            </button>
                        </div>

                        {/* Pagination Dots Theme */}
                        <div className="flex justify-start items-center gap-2 mt-2 px-4">
                            {Array.from({ length: totalSegments }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => jumpToSegment(i)}
                                    className={`h-1.5 transition-all duration-300 rounded-full ${activeIndex === i
                                        ? "w-10 bg-[#E2343E]"
                                        : "w-4 bg-gray-200 hover:bg-gray-300"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Autopartes y Repuestos Footer Replicated */}
                <div className="mt-20 text-center">
                    <h2 className="text-3xl font-black text-[#333333] tracking-tight mb-2">Autopartes y Repuestos</h2>
                    <p className="text-sm text-gray-500 font-medium">Genéricos / Homologada para todas las marcas</p>
                    <div className="w-full h-px bg-gray-100 mt-8"></div>
                </div>
            </div>
        </div>
    );
};
