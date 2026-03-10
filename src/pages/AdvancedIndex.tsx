import React, { useState, useEffect } from "react";
import { TopPromoBar } from "@/components/layout/TopPromoBar";
import { AdvancedHeader } from "@/components/layout/AdvancedHeader";
import { HeroBanner } from "@/components/layout/HeroBanner";
import { Footer } from "@/components/layout/Footer";
import { ProductsSection } from "@/components/products/ProductsSection";
import { StoreStructuredData } from "@/components/seo/StructuredData";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useCategories } from "@/hooks/use-categories";

const AdvancedIndex = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [promoVisible, setPromoVisible] = useState(true);
  const {
    categories,
    categoriesData,
    setCategories,
    mainCategories,
    subcategoriesByParent,
    thirdLevelBySubcategory,
  } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCatalog, setShowCatalog] = useState(false);

  const params = new URLSearchParams(location.search);
  const categoryParam = params.get("category");
  const searchParam = params.get("search");

  useEffect(() => {
    if (searchParam) setSearchTerm(searchParam);
    else setSearchTerm("");
  }, [searchParam]);

  const setSelectedCategory = (cat: string) => {
    if (cat === "Todos") {
      navigate("/");
      setShowCatalog(false);
      return;
    }
    navigate(`/categoria/${encodeURIComponent(cat)}`);
  };

  const whatsappNumber = "+573212619434";
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`;

  if (categoryParam) {
    return <Navigate to={`/categoria/${encodeURIComponent(categoryParam)}`} replace />;
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 overflow-x-hidden font-sans">
      <StoreStructuredData
        name="24/7"
        description="Tu tienda de confianza 24/7. Fragancias, regalería y más con envíos a todo el país."
      />

      <h1 className="sr-only">24/7 - Tu Tienda de Confianza</h1>

      <div className="w-full">
        <TopPromoBar setPromoVisible={setPromoVisible} />
      </div>
      <AdvancedHeader
        categories={categories}
        selectedCategory="Todos"
        setSelectedCategory={setSelectedCategory}
        promoVisible={promoVisible}
        mainCategories={mainCategories}
        subcategoriesByParent={subcategoriesByParent}
        thirdLevelBySubcategory={thirdLevelBySubcategory}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        allCategoriesData={categoriesData}
      />

      {!showCatalog && !searchParam && (
        <HeroBanner isCatalog={showCatalog} setShowCatalog={setShowCatalog} />
      )}

      <main className={`relative z-10 w-full ${(!showCatalog && !searchParam) ? 'pt-4' : 'pt-0'}`}>
        <ProductsSection
          selectedCategory="Todos"
          setSelectedCategory={setSelectedCategory}
          setCategories={setCategories}
          initialSearchTerm={searchTerm}
          showCatalog={showCatalog}
          setShowCatalog={setShowCatalog}
        />
      </main>

      <Footer />
    </div>
  );
};

export default AdvancedIndex;
