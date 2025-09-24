// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Plus, Minus } from "lucide-react";

// interface MenuItemProps {
//   id: string;
//   name: string;
//   description: string;
//   price: number;
//   image: string;
//   category: string;

//   quantity?: number;
//   onQuantityChange?: (id: string, quantity: number) => void;
// }

// export const MenuCard = ({ 
//   id, 
//   name, 
//   description, 
//   price, 
//   image, 
//   category, 

//   quantity = 0,
//   onQuantityChange 
// }: MenuItemProps) => {
//   const [localQuantity, setLocalQuantity] = useState(quantity);

//   const handleQuantityChange = (newQuantity: number) => {
//     const finalQuantity = Math.max(0, newQuantity);
//     setLocalQuantity(finalQuantity);
//     onQuantityChange?.(id, finalQuantity);
//   };

//   return (
//     <Card className="overflow-hidden hover:shadow-elegant transition-smooth animate-fade-in group">
//       <div className="relative overflow-hidden">
//         <img 
//           src={image} 
//           alt={name}
//           className="w-full h-48 object-cover transition-smooth group-hover:scale-105"
//         />
        
//       </div>
      
//       <CardHeader className="pb-2">
//         <div className="flex justify-between items-start">
//           <div className="flex-1">
//             <CardTitle className="text-lg leading-tight">{name}</CardTitle>
//             <Badge variant="outline" className="mt-1 text-xs">
//               {category}
//             </Badge>
//           </div>
//           <div className="text-lg font-bold text-primary">
//             ${price.toFixed(2)}
//           </div>
//         </div>
//       </CardHeader>
      
//       <CardContent className="pt-0">
//         <CardDescription className="text-sm leading-relaxed mb-4">
//           {description}
//         </CardDescription>
        
//         <div className="flex items-center justify-between">
//           {localQuantity === 0 ? (
//             <Button 
//               variant="hero" 
//               onClick={() => handleQuantityChange(1)}
//               className="flex-1"
//             >
//               <Plus className="w-4 h-4 mr-2" />
//               Add to Order
//             </Button>
//           ) : (
//             <div className="flex items-center gap-3">
//               <Button 
//                 variant="quantity" 
//                 onClick={() => handleQuantityChange(localQuantity - 1)}
//               >
//                 <Minus className="w-4 h-4" />
//               </Button>
              
//               <span className="font-semibold text-lg min-w-[2rem] text-center">
//                 {localQuantity}
//               </span>
              
//               <Button 
//                 variant="quantity" 
//                 onClick={() => handleQuantityChange(localQuantity + 1)}
//               >
//                 <Plus className="w-4 h-4" />
//               </Button>
//             </div>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// };




import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MenuItemProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;

  quantity?: number;
  onQuantityChange?: (id: string, quantity: number) => void;
  disabled?: boolean; // <--- new prop
}

export const MenuCard = ({
  id,
  name,
  description,
  price,
  image,
  category,
  quantity = 0,
  onQuantityChange,
  disabled = false, // default false
}: MenuItemProps) => {
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const { t, language } = useLanguage();

  const handleQuantityChange = (newQuantity: number) => {
    if (disabled) return; // Prevent changes if disabled
    const finalQuantity = Math.max(0, newQuantity);
    setLocalQuantity(finalQuantity);
    onQuantityChange?.(id, finalQuantity);
  };

  return (
    <Card
      className={`overflow-hidden hover:shadow-elegant transition-smooth animate-fade-in group ${disabled ? "opacity-50" : ""}`}
    >
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-48 object-cover transition-smooth group-hover:scale-105"
        />
        {disabled && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            Unavailable
          </span>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight">
              {language === 'ar' && name.includes('_ar') ? name : name}
            </CardTitle>
            <Badge variant="outline" className="mt-1 text-xs">
              {category}
            </Badge>
          </div>
          <div className="text-lg font-bold text-primary">${price.toFixed(2)}</div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription className="text-sm leading-relaxed mb-4">
          {language === 'ar' && description.includes('_ar') ? description : description}
        </CardDescription>

        <div className="flex items-center justify-between">
          {localQuantity === 0 ? (
            <Button
              variant="hero"
              onClick={() => handleQuantityChange(1)}
              className="flex-1"
              disabled={disabled} // <--- disabled
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('customer.addToOrder')}
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="quantity"
                onClick={() => handleQuantityChange(localQuantity - 1)}
                disabled={disabled || localQuantity <= 0} // <--- disabled
              >
                <Minus className="w-4 h-4" />
              </Button>

              <span className="font-semibold text-lg min-w-[2rem] text-center">{localQuantity}</span>

              <Button
                variant="quantity"
                onClick={() => handleQuantityChange(localQuantity + 1)}
                disabled={disabled} // <--- disabled
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
