"use client";

import { useState, useEffect } from "react";
import { getTestingGuide, TestingGuide } from "@/lib/testing-guides";
import { CheckCircle, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";

export default function CustomerTestingGuidePage() {
  const [guide, setGuide] = useState<TestingGuide | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGuide = async () => {
      const customerGuide = await getTestingGuide("customer");
      setGuide(customerGuide);
      setLoading(false);
    };

    loadGuide();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Testing guide not found</p>
          <Link href="/" className="text-green-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                {guide.title}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {guide.lastUpdated.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Guide Sections */}
        <div className="space-y-6">
          {guide.sections
            .sort((a, b) => a.order - b.order)
            .map((section, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                    {section.order}
                  </span>
                  {section.title}
                </h2>
                <div className="prose prose-blue max-w-none">
                  {section.content.split("\n").map((line, lineIndex) => {
                    // Handle markdown-style headers
                    if (line.startsWith("### ")) {
                      return (
                        <h3
                          key={lineIndex}
                          className="text-xl font-bold text-gray-800 mt-4 mb-2"
                        >
                          {line.replace("### ", "")}
                        </h3>
                      );
                    }
                    // Handle list items
                    if (line.startsWith("- ")) {
                      return (
                        <div
                          key={lineIndex}
                          className="flex items-start gap-2 ml-4 mb-2"
                        >
                          <CheckCircle className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                          <span className="text-gray-700">
                            {line.replace("- ", "")}
                          </span>
                        </div>
                      );
                    }
                    // Regular paragraphs
                    if (line.trim()) {
                      return (
                        <p key={lineIndex} className="text-gray-700 mb-2">
                          {line}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Start Testing?</h3>
          <p className="mb-6">
            Download the app and experience the future of taxi booking!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/download"
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-full font-bold transition"
            >
              Download App
            </Link>
            <Link
              href="/testing-info/driver"
              className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-full font-bold transition"
            >
              Driver Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
