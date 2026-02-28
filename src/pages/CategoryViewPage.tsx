import React, { useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { TopPromoBar } from "@/components/layout/TopPromoBar";
import { AdvancedHeader } from "@/components/layout/AdvancedHeader";
import { CategoryBanner } from "@/components/layout/CategoryBanner";
import { CategoryBreadcrumbs } from "@/components/layout/CategoryBreadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { ProductsSection } from "@/components/products/ProductsSection";
import { useCategories } from "@/hooks/use-categories";

const CategoryViewPage = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();
  const [promoVisible, setPromoVisible] = React.useState(true);
  const {
    categories,
    categoriesData,
    setCategories,
    mainCategories,
    subcategoriesByParent,
    thirdLevelBySubcategory,
    getCategoryByName,
    getBreadcrumbPath,
  } = useCategories();

  const categoryName = categorySlug ? decodeURIComponent(categorySlug) : "";
  const currentCategory = categoryName ? getCategoryByName(categoryName) : undefined;
  const breadcrumbPath = categoryName ? getBreadcrumbPath(categoryName) : [];

  const setSelectedCategory = (cat: string) => {
    if (cat === "Todos") {
      navigate("/");
      return;
    }
    navigate(`/categoria/${encodeURIComponent(cat)}`);
  };

  useEffect(() => {
    if (categoryName) window.scrollTo(0, 0);
  }, [categoryName]);

  const whatsappNumber = "+573212619434";
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`;

  if (!categoryName) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-white text-neutral-900 overflow-x-hidden font-sans">
      <div className="w-full">
        <TopPromoBar setPromoVisible={setPromoVisible} />
      </div>
      <AdvancedHeader
        categories={categories}
        selectedCategory={categoryName}
        setSelectedCategory={setSelectedCategory}
        promoVisible={promoVisible}
        mainCategories={mainCategories}
        subcategoriesByParent={subcategoriesByParent}
        thirdLevelBySubcategory={thirdLevelBySubcategory}
        allCategoriesData={categoriesData}
      />

      <CategoryBanner name={categoryName} image={currentCategory?.image} />
      <CategoryBreadcrumbs path={breadcrumbPath} />

      <main className="relative z-10 w-full pt-4">
        <ProductsSection
          selectedCategory={categoryName}
          setSelectedCategory={setSelectedCategory}
          setCategories={setCategories}
        />
      </main>

      <Footer />
    </div>
  );
};

export default CategoryViewPage;
