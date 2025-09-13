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
import { Plus, Minus, Star } from "lucide-react";
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
  disabled = false,
}: MenuItemProps) => {
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const { t } = useLanguage();

  const handleQuantityChange = (newQuantity: number) => {
    if (disabled) return; // Prevent changes if disabled
    const finalQuantity = Math.max(0, newQuantity);
    setLocalQuantity(finalQuantity);
    onQuantityChange?.(id, finalQuantity);
  };

  return (
    <Card
      className={`overflow-hidden transition-all duration-300 animate-fade-in group bg-white/95 backdrop-blur-sm border-0 shadow-elegant hover:shadow-glow hover:scale-105 ${disabled ? "opacity-50" : ""}`}
    >
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-48 object-cover transition-all duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {disabled && (
          <span className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-xs px-3 py-1 rounded-full font-medium">
            Unavailable
          </span>
        )}
        {!disabled && (
          <div className="absolute top-3 left-3 flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight">{name}</CardTitle>
            <Badge variant="outline" className="mt-1 text-xs">
              {category}
            </Badge>
          </div>
          <div className="text-lg font-bold text-primary">${price.toFixed(2)}</div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription className="text-sm leading-relaxed mb-4">{description}</CardDescription>

        <div className="flex items-center justify-between">
          {localQuantity === 0 ? (
            <Button
              className="flex-1 bg-gradient-warm hover:shadow-glow transition-all duration-300 h-11 font-semibold"
              onClick={() => handleQuantityChange(1)}
              disabled={disabled}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('addToOrder')}
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
