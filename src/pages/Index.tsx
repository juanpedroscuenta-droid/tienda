import React, { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { Header } from '@/components/layout/Header';
import { HeroSection } from '@/components/home/HeroSection';
import { ProductsSection } from '@/components/products/ProductsSection';

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [categories, setCategories] = useState<string[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <main>
            <HeroSection isCatalog={showCatalog} />
            <ProductsSection
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              setCategories={setCategories}
              showCatalog={showCatalog}
              setShowCatalog={setShowCatalog}
            />
          </main>

          {/* Footer */}
          <footer className="bg-muted/50 py-12 mt-16">
            <div className="container">
              <div className="grid md:grid-cols-4 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 gradient-orange rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">T</span>
                    </div>
                    <span className="text-lg font-bold gradient-text-orange">TIENDA 24-7</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Tu tienda premium con los mejores productos y atención personalizada.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Productos</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Electrónicos</li>
                    <li>Audio</li>
                    <li>Gaming</li>
                    <li>Fotografía</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Soporte</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Centro de Ayuda</li>
                    <li>Garantías</li>
                    <li>Devoluciones</li>
                    <li>Contacto</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Contacto</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>WhatsApp: +57 321 2619434</li>
                    <li>Email: Regalo.Algo@gmail.com</li>
                    <li>Horario: 8AM - 8PM</li>
                  </ul>
                </div>
              </div>

              <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
                <p>&copy; 2024 TIENDA 24-7. Todos los derechos reservados.</p>
              </div>
            </div>
          </footer>
        </div>
      </CartProvider>
    </AuthProvider>
  );
};

export default Index;
