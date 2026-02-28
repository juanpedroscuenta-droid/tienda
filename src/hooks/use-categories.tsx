import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchCategories as fetchCategoriesApi } from '@/lib/api';

export interface Category {
  id?: string;
  name: string;
  image?: string;
  parentId?: string;
  parentName?: string;
  isMain?: boolean;
}

export function useCategories() {
  const [categories, setCategories] = useState<string[]>(["Todos"]);
  const [categoriesData, setCategoriesData] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const categoriesFromApi = await fetchCategoriesApi();

        const todosCategory = {
          id: "todos",
          name: "Todos",
          image: "",
          isMain: true
        };

        const processedCats = [
          todosCategory,
          ...(categoriesFromApi || []).map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            image: cat.image,
            parentId: cat.parent_id,
            parentName: cat.parent_name,
            isMain: !cat.parent_id || cat.parent_id === ""
          }))
        ];

        setCategoriesData(processedCats);

        const mainCats = processedCats
          .filter(cat => cat.isMain)
          .map(cat => cat.name);

        setCategories(mainCats);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const mainCategories = useMemo(() => {
    return categoriesData.filter(cat => cat.isMain);
  }, [categoriesData]);

  const subcategoriesByParent = useMemo(() => {
    const mainCats = categoriesData.filter(c => c.isMain && c.id && c.id !== "todos");
    const mainIds = new Set(mainCats.map(c => c.id!));
    const mainById = Object.fromEntries(mainCats.map(c => [c.id!, c]));
    const result: Record<string, Category[]> = {};
    categoriesData.forEach(cat => {
      if (cat.parentId && mainIds.has(cat.parentId)) {
        const parent = mainById[cat.parentId];
        const parentName = parent?.name;
        if (parentName) {
          if (!result[parentName]) result[parentName] = [];
          result[parentName].push(cat);
        }
      }
    });
    return result;
  }, [categoriesData]);

  const thirdLevelBySubcategory = useMemo(() => {
    const mainIds = new Set(
      categoriesData.filter(c => c.isMain && c.id && c.id !== "todos").map(c => c.id!)
    );
    const subIds = new Set(
      categoriesData
        .filter(c => c.parentId && mainIds.has(c.parentId))
        .map(c => c.id!)
    );
    const result: Record<string, Category[]> = {};
    categoriesData
      .filter(c => c.id && c.id !== "todos")
      .forEach(cat => {
        if (cat.parentId && subIds.has(cat.parentId)) {
          const key = cat.parentId;
          if (!result[key]) result[key] = [];
          result[key].push(cat);
        }
      });
    return result;
  }, [categoriesData]);

  const categoriesById = useMemo(() => {
    const m: Record<string, Category> = {};
    categoriesData.forEach((c) => {
      if (c.id) m[c.id] = c;
    });
    return m;
  }, [categoriesData]);

  const categoriesByName = useMemo(() => {
    const m: Record<string, Category> = {};
    categoriesData.forEach((c) => {
      m[c.name] = c;
    });
    return m;
  }, [categoriesData]);

  const getCategoryById = useCallback((id: string) => categoriesById[id], [categoriesById]);
  const getCategoryByName = useCallback((name: string) => categoriesByName[name], [categoriesByName]);

  const getBreadcrumbPath = useCallback(
    (categoryName: string): string[] => {
      if (!categoryName || categoryName === "Todos") return [];
      const path: string[] = [];
      let cat = categoriesByName[categoryName];
      while (cat) {
        path.unshift(cat.name);
        cat = cat.parentId ? categoriesById[cat.parentId] : undefined;
      }
      if (path.length) path.unshift("Inicio");
      else path.push("Inicio", categoryName);
      return path;
    },
    [categoriesByName, categoriesById]
  );

  return {
    categories,
    categoriesData,
    mainCategories,
    subcategoriesByParent,
    thirdLevelBySubcategory,
    getCategoryById,
    getCategoryByName,
    getBreadcrumbPath,
    loading,
    setCategories,
  };
}
