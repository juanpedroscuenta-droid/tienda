import React, { useEffect, useState } from "react";
import { TopPromoBar } from "@/components/layout/TopPromoBar";
import { AdvancedHeader } from "@/components/layout/AdvancedHeader";
import { useCategories } from "@/hooks/use-categories";
import { getInfoSection } from "@/lib/info-sections";
import { HelpCircle } from "lucide-react";

const FAQPage = () => {
  const { categories, mainCategories, subcategoriesByParent, thirdLevelBySubcategory } = useCategories();
  const [selectedCategory, setSelectedCategory] = React.useState("Todos");
  const [promoVisible, setPromoVisible] = React.useState(true);
  const [faqContent, setFaqContent] = useState<string>('');
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFAQ = async () => {
      setLoading(true);
      try {
        const row = await getInfoSection("faqs");
        if (row) {
          setFaqContent(row.content || "");
          setEnabled(row.enabled ?? false);
        } else {
          setFaqContent("");
          setEnabled(false);
        }
      } catch (error) {
        console.error('Error fetching FAQ:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFAQ();
  }, []);

  // Parsear el contenido de FAQ en preguntas y respuestas
  const parseFAQContent = (content: string) => {
    if (!content) return [];
    
    // Dividir por bloques separados por múltiples líneas vacías o preguntas
    const faqs: { question: string; answer: string }[] = [];
    
    // Primero intentar dividir por bloques separados por dos o más líneas vacías
    const blocks = content.split(/\n\s*\n\s*\n/).filter(block => block.trim());
    
    blocks.forEach(block => {
      const lines = block.split('\n').filter(line => line.trim());
      if (lines.length === 0) return;
      
      // Buscar la primera línea que parece una pregunta
      let questionIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('¿') && line.length > 3) {
          questionIndex = i;
          break;
        }
      }
      
      if (questionIndex >= 0) {
        const question = lines[questionIndex].trim().replace(/^¿\s*/, '').replace(/\?$/, '').trim();
        const answerLines = lines.slice(questionIndex + 1);
        const answer = answerLines.join('\n').trim();
        
        if (question && answer) {
          faqs.push({ question, answer });
        }
      }
    });
    
    // Si no se encontraron FAQs con el método anterior, intentar dividir por líneas que empiezan con "¿"
    if (faqs.length === 0) {
      const lines = content.split('\n');
      let currentQuestion = '';
      let currentAnswer: string[] = [];
      
      lines.forEach((line) => {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('¿') && trimmed.length > 3) {
          // Guardar pregunta anterior
          if (currentQuestion && currentAnswer.length > 0) {
            faqs.push({
              question: currentQuestion.replace(/^¿\s*/, '').replace(/\?$/, '').trim(),
              answer: currentAnswer.join('\n').trim()
            });
          }
          // Nueva pregunta
          currentQuestion = trimmed;
          currentAnswer = [];
        } else if (currentQuestion && trimmed.length > 0) {
          currentAnswer.push(trimmed);
        }
      });
      
      // Agregar última pregunta
      if (currentQuestion && currentAnswer.length > 0) {
        faqs.push({
          question: currentQuestion.replace(/^¿\s*/, '').replace(/\?$/, '').trim(),
          answer: currentAnswer.join('\n').trim()
        });
      }
    }

    return faqs;
  };

  const faqs = parseFAQContent(faqContent);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {promoVisible && <TopPromoBar setPromoVisible={setPromoVisible} />}
      <AdvancedHeader
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        promoVisible={promoVisible}
        mainCategories={mainCategories}
        subcategoriesByParent={subcategoriesByParent}
        thirdLevelBySubcategory={thirdLevelBySubcategory}
      />
      <main className="flex-1 flex flex-col bg-white">
        {/* FAQ Content Section - Diseño limpio y organizado */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            {/* Título principal */}
            <h1 className="text-4xl md:text-5xl font-bold text-black text-center mb-12 md:mb-16 tracking-tight">
              PREGUNTAS FRECUENTES
            </h1>

            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400"></div>
                <p className="mt-4 text-gray-600 font-medium">Cargando ayuda rápida...</p>
              </div>
            ) : enabled && faqs.length > 0 ? (
              <div className="space-y-0">
                {faqs.map((faq, index) => (
                  <div key={index} className="pb-8 md:pb-10">
                    {/* Pregunta */}
                    <h3 className="text-lg md:text-xl font-bold text-black mb-3 md:mb-4 leading-tight">
                      {faq.question.startsWith('¿') ? faq.question : `¿${faq.question}?`}
                    </h3>
                    
                    {/* Respuesta */}
                    <div className="text-base md:text-lg text-gray-700 leading-relaxed mb-6 md:mb-8">
                      {faq.answer.split('\n').map((line, lineIndex, lines) => {
                        const trimmed = line.trim();
                        
                        // Detectar listas con viñetas (- o •)
                        if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                          const content = trimmed.replace(/^[-•]\s*/, '');
                          return (
                            <div key={lineIndex} className="ml-4 mb-2 flex items-start">
                              <span className="mr-2">•</span>
                              <span>{content}</span>
                            </div>
                          );
                        }
                        
                        // Detectar listas numeradas (1. o 1))
                        const numberedMatch = trimmed.match(/^(\d+)[\.\)]\s*(.+)$/);
                        if (numberedMatch) {
                          return (
                            <div key={lineIndex} className="ml-4 mb-2 flex items-start">
                              <span className="mr-2 font-medium">{numberedMatch[1]}.</span>
                              <span>{numberedMatch[2]}</span>
                            </div>
                          );
                        }
                        
                        // Párrafos normales
                        if (trimmed.length > 0) {
                          // Verificar si la línea anterior o siguiente es una lista para mantener el espaciado
                          const prevIsList = lineIndex > 0 && (
                            lines[lineIndex - 1].trim().startsWith('-') ||
                            lines[lineIndex - 1].trim().startsWith('•') ||
                            /^\d+[\.\)]/.test(lines[lineIndex - 1].trim())
                          );
                          const nextIsList = lineIndex < lines.length - 1 && (
                            lines[lineIndex + 1].trim().startsWith('-') ||
                            lines[lineIndex + 1].trim().startsWith('•') ||
                            /^\d+[\.\)]/.test(lines[lineIndex + 1].trim())
                          );
                          
                          return (
                            <p key={lineIndex} className={`mb-2 ${prevIsList ? 'mt-3' : ''} ${nextIsList ? 'mb-3' : ''}`}>
                              {trimmed}
                            </p>
                          );
                        }
                        
                        // Líneas vacías (solo si no están entre listas)
                        return null;
                      })}
                    </div>
                    
                    {/* Separador horizontal - solo si no es el último */}
                    {index < faqs.length - 1 && (
                      <div className="border-t border-gray-300"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : enabled && faqContent ? (
              // Si hay contenido pero no se pudo parsear, mostrar el contenido completo
              <div className="bg-white">
                <div className="text-base md:text-lg text-gray-700 font-normal leading-relaxed w-full max-w-none whitespace-pre-line">
                  {faqContent}
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  La ayuda rápida estará disponible pronto.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Por favor, contacta con nosotros si tienes alguna pregunta.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default FAQPage;
