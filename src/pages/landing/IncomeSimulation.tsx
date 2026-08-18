import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LeadFormModal } from "@/components/LeadFormModal";

const simulationData = [
  { label: "Bulan 1-3", income: 1125000 },
  { label: "Bulan 4-6", income: 1687000 },
  { label: "Bulan 7-9", income: 13781250 },
  { label: "Bulan 10-12", income: 77062500 },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const IncomeSimulation = ({ hasReferral }: { hasReferral: boolean }) => {
  const [sliderValue, setSliderValue] = useState([0]);
  const currentData = simulationData[sliderValue[0]];

  const consultationButton = (
    <Button variant="secondary" size="lg" className="text-base px-8 py-6 h-auto">
      Simulasikan Potensi Anda
    </Button>
  );

  const registrationButton = (
    <Button variant="secondary" size="lg" className="text-base px-8 py-6 h-auto">
      Daftar Kemitraan
    </Button>
  );

  return (
    <section className="bg-primary py-20 px-4 text-primary-foreground">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold">
          Bagaimana Komitmen Kecil Bisa Menjadi Aset Besar?
        </h2>
        <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
          Geser slider di bawah untuk melihat simulasi potensi pendapatan pasif Anda seiring waktu dengan duplikasi sistem yang konsisten.
        </p>

        <Card className="mt-12 bg-white/10 backdrop-blur-sm border-none text-white">
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-xl font-medium text-gray-300">{currentData.label}</p>
              <p className="text-5xl font-bold text-secondary my-4">
                {formatCurrency(currentData.income)}
              </p>
              <p className="text-lg">Estimasi Pendapatan per Bulan</p>
            </div>

            <div className="mt-10 px-4">
              <Slider
                value={sliderValue}
                onValueChange={setSliderValue}
                max={simulationData.length - 1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-sm text-gray-400">
                {simulationData.map((data, index) => (
                  <span key={index} className="w-1/4 text-center">{data.label.split(' ')[1]}</span>
                ))}
              </div>
            </div>

            <p className="mt-8 text-xs text-gray-400 text-center">
              *Simulasi berdasarkan pertumbuhan duplikasi jaringan mitra. Hasil aktual bergantung pada kinerja tim.
            </p>
          </CardContent>
        </Card>

<div className="mt-10 flex flex-col justify-center items-center gap-4">
          {hasReferral ? (
            <>
              <LeadFormModal 
                trigger={registrationButton}
                formType="registration"
              />
              <div className="text-center">
                <span className="text-gray-300 text-sm">Masih ada yang ingin ditanyakan sebelum mendaftar? </span>
                <LeadFormModal 
                  trigger={<button className="text-secondary hover:text-secondary/80 text-sm font-semibold underline">Konsultasi di Sini</button>}
                  formType="consultation"
                />
              </div>
            </>
          ) : (
            <LeadFormModal 
              trigger={consultationButton}
              formType="consultation"
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default IncomeSimulation;