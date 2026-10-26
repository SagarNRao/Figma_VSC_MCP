import React from "react";

const DotsBackground = () => {
  const rows = 20;
  const cols = 60;
  const dots = Array.from({ length: rows * cols }, (_, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const isOrange = Math.random() > 0.7;
    const isDark = Math.random() > 0.5;
    return { row, col, isOrange, isDark };
  });

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#0a0a0a]">
        {dots.map((dot, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${(dot.col / cols) * 100}%`,
              top: `${(dot.row / rows) * 100}%`,
              backgroundColor: dot.isOrange
                ? "#ff6600"
                : dot.isDark
                ? "#333333"
                : "#1a1a1a",
              opacity: dot.isOrange ? 0.8 : 0.4,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const HeroSection = () => {
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <DotsBackground />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#ff6600] rounded flex items-center justify-center">
              <span className="text-white text-sm font-bold">G</span>
            </div>
            <span className="text-lg font-semibold">Grafkit</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">
              Product
            </a>
            <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">
              Changelog
            </a>
            <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">
              Docs
            </a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">
            Login
          </a>
          <a
            href="#"
            className="bg-[#ff6600] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#e65c00] transition-colors"
          >
            Sign Up
          </a>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side */}
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Some really
              <br />
              cool graph stuff
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Lorem ipsum dolor sit amet consectetur
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="bg-[#ff6600] text-white px-6 py-3 rounded-full font-medium hover:bg-[#e65c00] transition-colors"
              >
                Get started
              </a>
              <a
                href="#"
                className="border border-gray-600 text-white px-6 py-3 rounded-full font-medium hover:border-gray-400 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Right Side - Feature List */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-white rounded-full flex-shrink-0"></div>
              <span className="text-gray-300">Lorem ipsum dolor sit amet consectetur</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-white rounded-full flex-shrink-0"></div>
              <span className="text-gray-300">Lorem ipsum dolor sit amet consectetur</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Text Section */}
      <div className="relative z-10 px-8 pb-16">
        <div className="text-center">
          <h2 className="text-3xl lg:text-4xl font-semibold leading-relaxed">
            <span className="text-white">Ever wanted to do really cool graph stuff</span>
            <br />
            <span className="text-white">because i did</span>{" "}
            <span className="text-gray-500">and thats why Grafkit exists</span>
            <br />
            <span className="text-gray-500">so you can do cool graph stuff</span>
          </h2>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  return <HeroSection />;
}