import React from "react";

const DownloadApp: React.FC = () => {
  return (
    <div className=" flex items-center justify-center ">
      <div className="max-w-sm mx-auto   p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <svg
            className="w-9 h-9"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17 18C15.89 18 15 18.89 15 20C15 21.1 15.89 22 17 22C18.1 22 19 21.1 19 20C19 18.89 18.1 18 17 18ZM1 2H4.27L5.21 4H20C20.55 4 21 4.45 21 5C21 5.17 20.95 5.34 20.88 5.5L17.3 11.97C16.96 12.58 16.3 13 15.55 13H8.1L7.2 14.63L7.17 14.75C7.17 14.89 7.28 15 7.42 15H19V17H7C5.89 17 5 16.1 5 15C5 14.65 5.09 14.32 5.24 14.04L6.6 11.59L3 4H1V2ZM7 18C5.89 18 5 18.89 5 20C5 21.1 5.89 22 7 22C8.1 22 9 21.1 9 20C9 18.89 8.1 18 7 18Z"
              fill="#0b5052"
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900">Download the App</h1>
        </div>

        {/* Features Banner */}
        <div className="bg-gradient-to-br from-[#0f766e] to-[#14b8a6] rounded-2xl p-5 mb-6">
          <h2 className="text-white text-lg font-bold mb-4">Download App</h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Free Delivery Feature */}
            <div className="flex items-center gap-2">
              <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-7 h-7 text-blue-500"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3 5C3 3.89543 3.89543 3 5 3H15C16.1046 3 17 3.89543 17 5V15H19.5858L21.2929 16.7071C21.9229 17.3371 21.4767 18.5 20.5858 18.5H17.874C17.4299 19.9659 16.0892 21 14.5 21C12.9108 21 11.5701 19.9659 11.126 18.5H8.87398C8.42994 19.9659 7.08925 21 5.5 21C3.567 21 2 19.433 2 17.5C2 17.2239 2.22386 17 2.5 17H3V5ZM5 15V5H15V15H5ZM5.5 19C6.32843 19 7 18.3284 7 17.5C7 16.6716 6.32843 16 5.5 16C4.67157 16 4 16.6716 4 17.5C4 18.3284 4.67157 19 5.5 19ZM14.5 19C15.3284 19 16 18.3284 16 17.5C16 16.6716 15.3284 16 14.5 16C13.6716 16 13 16.6716 13 17.5C13 18.3284 13.6716 19 14.5 19ZM17 13V9H19L21 11.5V13H17Z" />
                </svg>
              </div>
              <div className="text-white text-[15px] font-semibold leading-tight">
                Free
                <br />
                Delivery
              </div>
            </div>

            {/* Exclusive Vouchers Feature */}
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-7 h-7 text-pink-500"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M2 8C2 6.89543 2.89543 6 4 6H20C21.1046 6 22 6.89543 22 8V10C20.8954 10 20 10.8954 20 12C20 13.1046 20.8954 14 22 14V16C22 17.1046 21.1046 18 20 18H4C2.89543 18 2 17.1046 2 16V14C3.10457 14 4 13.1046 4 12C4 10.8954 3.10457 10 2 10V8ZM14 12L14.7071 11.2929L16.7071 13.2929L16 14L14 12ZM9 9.5C9 10.3284 8.32843 11 7.5 11C6.67157 11 6 10.3284 6 9.5C6 8.67157 6.67157 8 7.5 8C8.32843 8 9 8.67157 9 9.5ZM16.5 16C17.3284 16 18 15.3284 18 14.5C18 13.6716 17.3284 13 16.5 13C15.6716 13 15 13.6716 15 14.5C15 15.3284 15.6716 16 16.5 16Z" />
                </svg>
              </div>
              <div className="text-white text-[15px] font-semibold leading-tight">
                Exclusive
                <br />
                Vouchers
              </div>
            </div>
          </div>
        </div>

        {/* QR Code and Store Buttons */}
        <div className="flex gap-5 items-center mb-5">
          {/* QR Code */}
          <div className="w-[120px] h-[120px] bg-white rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-gray-200">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://yourapp.com/download"
              alt="QR Code for App Download"
              className="w-full h-full rounded-lg"
            />
          </div>

          {/* Store Buttons */}
          <div className="flex flex-col gap-3 flex-1">
            {/* Google Play Button */}
            <a
              href="https://play.google.com/store/apps/details?id=com.yourapp"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-3 hover:scale-105 transition-transform duration-200 shadow-md hover:shadow-lg"
            >
              <svg
                className="w-6 h-6 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.609 1.814L13.792 12 3.61 22.186a1.214 1.214 0 0 1-.021-1.766L3.609 1.814z"
                  fill="#00D9FF"
                />
                <path
                  d="M14.5 12.707l3.867 3.867-5.532 3.189a1.214 1.214 0 0 1-.545.132l5.754-6.481L14.5 12.707z"
                  fill="#FFCE00"
                />
                <path
                  d="M19.072 11.293L14.5 7.721l-3.544-3.544a1.214 1.214 0 0 1 .545.132l7.571 4.362a1.214 1.214 0 0 1 0 2.111l.002.001-7.573 4.362z"
                  fill="#FF3A44"
                />
                <path
                  d="M13.792 5.186L4.095 1.997a1.214 1.214 0 0 0-.486 1.796v.02L13.792 12l-.707.707L3.609 22.186z"
                  fill="#00F076"
                />
              </svg>
              <div className="flex flex-col items-start">
                <span className="text-white text-[10px] uppercase tracking-wider font-medium">
                  GET IT ON
                </span>
                <span className="text-white text-sm font-bold -mt-0.5">
                  Google Play
                </span>
              </div>
            </a>

            {/* App Store Button */}
            <a
              href="https://apps.apple.com/app/yourapp"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-3 hover:scale-105 transition-transform duration-200 shadow-md hover:shadow-lg"
            >
              <svg
                className="w-6 h-6 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                  fill="#fff"
                />
              </svg>
              <div className="flex flex-col items-start">
                <span className="text-white text-[10px] uppercase tracking-wider font-medium">
                  Download on the
                </span>
                <span className="text-white text-sm font-bold -mt-0.5">
                  App Store
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* Download Text */}
        <div className="text-center">
          <p className="text-gray-700 text-sm font-semibold mb-2">
            Download the App Now!
          </p>
         
        </div>
      </div>
    </div>
  );
};

export default DownloadApp;
