"use client";

export default function MapEmbed({ location }: { location: string }) {
  const url = `https://maps.google.com/maps?width=600&height=400&hl=en&q=${encodeURIComponent(
    location
  )}&t=&z=14&ie=UTF8&iwloc=B&output=embed`;

  return (
    <div className="relative w-[1200px] h-[800px]">
      <iframe src={url} className="w-full h-full" />
    </div>
  );
}