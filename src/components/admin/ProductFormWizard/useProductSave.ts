import { toast } from '@/hooks/use-toast';
import { cn, parseFormattedPrice } from "@/lib/utils";
import { createProduct, updateProduct } from '@/lib/api';
import { db } from '@/firebase'; // Keeping for revisions until migrated
import { ProductFormData } from './types';

interface SaveProductParams {
  formData: ProductFormData;
  categories: Array<{ id: string; name: string; parentId?: string | null }>;
  user: any;
  liberta: string;
  isEditing?: boolean;
  editingId?: string | null;
  onSuccess?: () => void;
}

export const useProductSave = () => {
  const isSupabase = typeof (db as any)?.from === 'function';

  const saveProduct = async ({
    formData,
    categories,
    user,
    liberta,
    isEditing = false,
    editingId = null,
    onSuccess
  }: SaveProductParams): Promise<void> => {
    // Validación
    if (!formData.name || !formData.price || !formData.stock || !formData.category) {
      toast({
        variant: "destructive",
        title: "Error al guardar producto",
        description: "Por favor completa los campos obligatorios."
      });
      throw new Error("Campos obligatorios incompletos");
    }

    const numericPrice = parseFormattedPrice(formData.price);
    const numericStock = parseInt(formData.stock, 10);
    const numericCost = formData.cost ? parseFormattedPrice(formData.cost) : null;

    if (isNaN(numericPrice) || isNaN(numericStock) || (formData.cost && isNaN(numericCost as number))) {
      toast({
        variant: "destructive",
        title: "Error al guardar producto",
        description: "El precio, costo y stock deben ser valores numéricos."
      });
      throw new Error("Valores numéricos inválidos");
    }

    // Obtener nombres de categorías
    const categoryName = categories.find(cat => cat.id === formData.category)?.name || "";
    const subcategoryName = formData.subcategory
      ? categories.find(cat => cat.id === formData.subcategory)?.name || ""
      : "";
    const terceraCategoriaName = formData.terceraCategoria
      ? categories.find(cat => cat.id === formData.terceraCategoria)?.name || ""
      : "";

    const now = new Date().toISOString();

    if (isSupabase) {
      const supabasePayload: any = {
        name: formData.name,
        description: formData.description,
        price: numericPrice,
        original_price: formData.isOffer ? parseFormattedPrice(formData.originalPrice) : numericPrice,
        image: formData.image || null,
        additional_images: formData.additionalImages?.filter(Boolean) ?? [],
        category: formData.category,
        category_name: categoryName || null,
        subcategory: formData.subcategory || null,
        subcategory_name: subcategoryName || null,
        tercera_categoria: formData.terceraCategoria || null,
        tercera_categoria_name: terceraCategoriaName || null,
        stock: numericStock,
        cost: numericCost,
        is_published: formData.isPublished,
        is_offer: formData.isOffer,
        discount: formData.isOffer ? parseFormattedPrice(formData.discount) : 0,
        benefits: formData.benefits ?? [],
        warranties: formData.warranties ?? [],
        payment_methods: formData.paymentMethods ?? [],
        colors: formData.colors ?? [],
        // Guardar opciones de filtros dentro de specifications
        specifications: formData.specifications ?? [],
        brand: formData.brand || null,
        last_modified_by: user?.email || "unknown",
      };

      // Limpiar especificaciones de filtros previos para evitar duplicados
      const cleanSpecifications = (supabasePayload.specifications || []).filter(
        (s: any) => s.name !== '_filter_options'
      );

      // Agregar opciones de filtros a specifications si existen
      console.log('--- PREPARING TO SAVE FILTERS ---');
      console.log('Current filterOptions in formData:', formData.filterOptions);

      if (formData.filterOptions && Object.entries(formData.filterOptions).some(([_, opts]) => opts.length > 0)) {
        // Agregar las opciones de filtros como una especificación especial
        const filterOptionsSpec = {
          name: '_filter_options',
          value: JSON.stringify(formData.filterOptions)
        };
        console.log('Saving filter options spec:', filterOptionsSpec);

        supabasePayload.specifications = [
          ...cleanSpecifications,
          filterOptionsSpec
        ];
      } else {
        console.log('No filter options selected to save');
        supabasePayload.specifications = cleanSpecifications;
      }

      console.log('Final specifications payload:', supabasePayload.specifications);

      try {
        if (isEditing && editingId) {
          if (liberta === "si") {
            console.log('Sending update request to backend for ID:', editingId);
            const response = await updateProduct(editingId, supabasePayload);
            console.log('Response from backend update:', response);

            toast({
              title: "Producto actualizado",
              description: "El producto ha sido actualizado exitosamente."
            });
          } else {
            // Enviar a revisión
            console.log('Sending product to revision because liberta is not "si"');
            const { error } = await (db as any).from("revision").insert([{
              type: "edit",
              data: { ...supabasePayload, id: editingId },
              status: "pendiente",
              timestamp: now,
              editorEmail: user?.email || "unknown",
              userName: user?.name || user?.email || "unknown"
            }]);

            if (error) throw error;

            toast({
              title: "Cambios enviados a revisión",
              description: "Los cambios han sido enviados para aprobación del administrador."
            });
          }
        } else {
          let newProductId: string | null = null;

          if (liberta === "si") {
            const inserted = await createProduct({ ...supabasePayload, created_by: user?.email || "unknown" });
            newProductId = inserted?.id || null;

            toast({
              title: "Producto agregado",
              description: "El producto ha sido agregado exitosamente."
            });
          } else {
            // Enviar a revisión
            const { error } = await (db as any).from("revision").insert([{
              type: "add",
              data: supabasePayload,
              status: "pendiente",
              timestamp: now,
              editorEmail: user?.email || "unknown",
              userName: user?.name || user?.email || "unknown"
            }]);

            if (error) throw error;

            toast({
              title: "Producto enviado a revisión",
              description: "El producto ha sido enviado para aprobación del administrador."
            });
          }

          // Guardar grupos de filtros si existen (solo si se creó directamente, no en revisión)
          if (formData.filterGroups && formData.filterGroups.length > 0 && newProductId) {
            const filterGroupRelations = formData.filterGroups.map((groupId: string) => ({
              product_id: newProductId,
              filter_group_id: groupId
            }));

            await (db as any)
              .from("product_filter_groups")
              .insert(filterGroupRelations);
          }
        }

        // Guardar grupos de filtros para productos editados
        if (isEditing && editingId && formData.filterGroups !== undefined) {
          console.log('--- UPDATING PRODUCT FILTER GROUPS ---');
          console.log('Filter groups in formData:', formData.filterGroups);

          // Primero eliminar relaciones existentes
          const { error: deleteError } = await (db as any)
            .from("product_filter_groups")
            .delete()
            .eq("product_id", editingId);

          if (deleteError) {
            console.error('Error deleting old filter groups:', deleteError);
          } else {
            console.log('Old filter groups deleted successfully');
          }

          // Luego insertar las nuevas relaciones si hay grupos seleccionados
          if (formData.filterGroups.length > 0) {
            const filterGroupRelations = formData.filterGroups.map((groupId: string) => ({
              product_id: editingId,
              filter_group_id: groupId
            }));

            console.log('Inserting new filter group relations:', filterGroupRelations);

            const { error: insertError } = await (db as any)
              .from("product_filter_groups")
              .insert(filterGroupRelations);

            if (insertError) {
              console.error('Error inserting new filter groups:', insertError);
            } else {
              console.log('New filter groups inserted successfully');
            }
          }
        }

        onSuccess?.();
      } catch (error: any) {
        console.error("Error al guardar producto:", error);
        toast({
          variant: "destructive",
          title: "Error al guardar producto",
          description: error?.message || "Ocurrió un error al guardar el producto."
        });
        throw error;
      }
    } else {
      // Fallback a Firestore si es necesario
      toast({
        variant: "destructive",
        title: "No disponible",
        description: "Esta funcionalidad requiere Supabase configurado."
      });
      throw new Error("Supabase no disponible");
    }
  };

  return { saveProduct };
};
