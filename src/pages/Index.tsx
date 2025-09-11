import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SubjectsSection from "@/components/SubjectsSection";
import HomeworkSection from "@/components/HomeworkSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <SubjectsSection />
        <HomeworkSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
