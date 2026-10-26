import React from "react";

export default function Page() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold">Grafkit</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm text-gray-300 hover:text-white">
              Product
            </a>
            <a href="#" className="text-sm text-gray-300 hover:text-white">
              Changelog
            </a>
            <a href="#" className="text-sm text-gray-300 hover:text-white">
              Docs
            </a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="text-sm text-gray-300 hover:text-white">
            Login
          </a>
          <a
            href="#"
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
          >
            Sign Up
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-16 md:py-24">
        {/* Dot pattern background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, #333 1px, transparent 1px)`,
            backgroundSize: "12px 12px",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left side */}
            <div>
              <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
                Some really cool graph stuff
              </h1>
              <p className="text-gray-400 text-lg mb-8">
                Lorem ipsum dolor sit amet consectetur
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-full transition-colors"
                >
                  Get started
                </a>
                <a
                  href="#"
                  className="border border-gray-600 hover:border-white text-white font-medium px-6 py-3 rounded-full transition-colors"
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Right side - bullet points */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-white rounded-full flex-shrink-0" />
                <span className="text-white">
                  Lorem ipsum dolor sit amet consectetur
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-white rounded-full flex-shrink-0" />
                <span className="text-white">
                  Lorem ipsum dolor sit amet consectetur
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Graph visualization section */}
      <section className="relative h-64 md:h-96 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle, #333 1px, transparent 1px)`,
            backgroundSize: "12px 12px",
          }}
        />

        {/* Orange dots visualization */}
        <div className="absolute inset-0 flex items-end justify-center gap-1 px-4">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-1"
              style={{
                height: `${Math.random() * 80 + 20}%`,
              }}
            >
              {Array.from({ length: 10 }).map((_, j) => (
                <div
                  key={j}
                  className={`w-2 h-2 rounded-full ${
                    Math.random() > 0.5 ? "bg-orange-500" : "bg-transparent"
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom text section */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            <span className="text-white">Ever wanted to do really cool graph stuff</span>
            <br />
            <span className="text-white">because i did</span>{" "}
            <span className="text-gray-500">and thats why Grafkit exists</span>
            <br />
            <span className="text-gray-500">so you can do cool graph stuff</span>
          </h2>
        </div>
      </section>
    </div>
  );
}