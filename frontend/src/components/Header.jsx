import React from 'react';

export default function Header() {
  return (
    <header className="flex justify-between items-center h-16 px-lg bg-surface dark:bg-surface-dim shadow-sm sticky top-0 z-30 border-b border-outline-variant/20">
      {/* Mobile Title */}
      <div className="flex items-center md:hidden">
        <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
          LogSense AI
        </span>
      </div>

      {/* Search Bar (Desktop) */}
      <div className="flex-1 max-w-md mx-xl hidden md:flex items-center">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-body-lg">
            search
          </span>
          <input
            className="w-full pl-xl pr-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary-container transition-all"
            placeholder="Search logs, queries..."
            type="text"
          />
        </div>
      </div>

      {/* Right Icons & Actions */}
      <div className="flex items-center gap-md ml-auto">
        <button className="text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed transition-colors cursor-pointer active:opacity-80 p-sm rounded-full hover:bg-surface-container-high">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed transition-colors cursor-pointer active:opacity-80 p-sm rounded-full hover:bg-surface-container-high">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <button className="text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed transition-colors cursor-pointer active:opacity-80 p-sm rounded-full hover:bg-surface-container-high">
          <span className="material-symbols-outlined">help</span>
        </button>
        <img
          className="w-8 h-8 rounded-full border border-outline-variant object-cover ml-sm cursor-pointer hover:opacity-80 transition-opacity"
          alt="Avatar"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6POU-w93w3tSWDbobPi0g-30X-Nb_J7IKU-8kssMcQVZ-Lguo63kKxORewifF2GzilyyS8YV0XXuaMvpBd5V44Vl_nPhI8a22M4KWS17vhLmIf03rhpzwBvvkZUBffu9TWJDeNeSIyl0I79HX9Yxq9FJDItB8tMHU7BD2HOSdURmvbzjpzPPgMspfvarf-3cAGT6qLkKTFE325hL-6yQeBxiv2VI8qIZLYFyZHy6trKzlWgQX3ebsee_Fbqsp-pEdFrDPGqfph5g"
        />
      </div>
    </header>
  );
}
