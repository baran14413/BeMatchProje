import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gem } from "lucide-react";

export default function PremiumPage() {
    return (
        <div className="container mx-auto max-w-3xl p-4 md:p-8">
             <Card className="bg-gradient-to-br from-purple-500 to-blue-600 text-white overflow-hidden">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Gem className="w-10 h-10"/>
                        <CardTitle className="text-3xl text-white">BeWalk Premium</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <p className="text-purple-200 text-lg">
                       Sınırsız beğeni, gelişmiş filtreler, kimlerin sizi beğendiğini görme ve daha birçok özel özellikle tanışın.
                    </p>
                    <Button className="bg-white text-purple-600 hover:bg-gray-100 w-full font-bold text-lg py-6">
                        Hemen Premium'a Geç
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
