import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchProducts as fetchProductsApi } from "@/lib/api";
import { Product } from "@/contexts/CartContext";
import { ProductCard } from "./ProductCard";

export const NewProductsCarousel: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Number of pagination segments
    const totalSegments = 3;

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const allProducts = await fetchProductsApi();
                const published = allProducts.filter(p => p.isPublished !== false);
                setProducts(published.slice(0, 10));
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

    if (loading || products.length === 0) {
        return null;
    }

    return (
        <div className="bg-white w-full mb-8">
            <h3 className="text-[#1a2b3c] font-bold text-xl mb-6 tracking-tight uppercase px-6 sm:px-8">{"PRODUCTOS NUEVOS"}</h3>

            <div className="relative group/carousel sm:grid sm:grid-cols-[52px_1fr_52px] items-center">

                {/* DESKTOP Left Button */}
                <div className="hidden sm:flex justify-center">
                    <button
                        onClick={scrollLeft}
                        aria-label="Anterior"
                        className="bg-[#005cb3] text-white rounded-full p-3 shadow-xl transition-all hover:bg-[#004a96] hover:scale-110 active:scale-95 flex items-center justify-center flex-shrink-0"
                    >
                        <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
                    </button>
                </div>

                {/* MOBILE Left Button (Overlay) */}
                <button
                    onClick={scrollLeft}
                    aria-label="Anterior"
                    className="sm:hidden absolute left-0 top-1/2 -translate-y-1/2 z-40 bg-[#005cb3]/90 text-white rounded-full p-2 shadow-xl -translate-x-1/2 flex items-center justify-center"
                >
                    <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                </button>

                {/* SCROLL TRACK */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-0 sm:gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-8 pt-2 w-full sm:px-3"
                >
                    {products.map(product => (
                        <div
                            key={product.id}
                            className="flex-[0_0_50%] sm:flex-[0_0_44%] lg:flex-[0_0_31%] min-w-0 shrink-0"
                        >
                            <div className="px-1 sm:px-0 h-full">
                                <ProductCard product={product} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* DESKTOP Right Button */}
                <div className="hidden sm:flex justify-center">
                    <button
                        onClick={scrollRight}
                        aria-label="Siguiente"
                        className="bg-[#005cb3] text-white rounded-full p-3 shadow-xl transition-all hover:bg-[#004a96] hover:scale-110 active:scale-95 flex items-center justify-center flex-shrink-0"
                    >
                        <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
                    </button>
                </div>

                {/* MOBILE Right Button (Overlay) */}
                <button
                    onClick={scrollRight}
                    aria-label="Siguiente"
                    className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 z-40 bg-[#005cb3]/90 text-white rounded-full p-2 shadow-xl translate-x-1/2 flex items-center justify-center"
                >
                    <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                </button>
            </div>

            {/* Pagination dots */}
            <div className="flex justify-center items-center gap-2 mt-2 pb-4">
                {Array.from({ length: totalSegments }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => jumpToSegment(i)}
                        className={`h-1.5 transition-all duration-300 rounded-full ${activeIndex === i
                            ? "w-10 bg-[#005cb3]"
                            : "w-6 bg-gray-300 hover:bg-gray-400"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};
