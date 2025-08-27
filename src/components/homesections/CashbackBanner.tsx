"use client";

import { Button } from "@/components/ui/button";

export default function CashbackBanner() {
  return (
    <section className="w-full  px-4">
      <div
        className="relative w-full h-auto  md:max-w-6xl xl:max-w-7xl 2xl:max-w-[90%] mx-auto rounded-2xl bg-[url('/homesection/homev3-cashback.jpg')] bg-cover bg-center bg-no-repeat flex flex-col items-start justify-center p-0 md:p-12 "
       
      >
        <div className="flex flex-col gap-4 md:w-2/3  p-6 rounded-xl">
          <h2 className="text-xm md:text-3xl font-bold text-[#004d40] leading-snug">
            Earn cash back for the things you buy <br />
            everywhere, every day
          </h2>

          <div className="hidden md:flex items-center gap-2 md:gap-4 mt-4">
            <Button className="bg-[#005c5c] hover:bg-[#004747] text-white rounded-lg px-6 py-2">
              Apply Now
            </Button>
            <a
              href="#"
              className="text-[#005c5c] font-medium underline-offset-2 hover:underline"
            >
              Learn More
            </a>
          </div>

          <p className="hidden md:flex text-xm text-gray-700 mt-2">
            Application via Motta.{" "}
            <a
              href="#"
              className="underline underline-offset-2 hover:text-black"
            >
              See Terms & Conditions.
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
