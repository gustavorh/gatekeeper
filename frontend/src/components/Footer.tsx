"use client";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Left side - Brand and info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-2">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">
                Gatekeeper
              </span>
            </div>
            <div className="hidden md:block">
              <span className="text-xs text-gray-500">•</span>
            </div>
            <div className="hidden md:block">
              <span className="text-xs text-gray-500">
                Sistema de Control de Acceso
              </span>
            </div>
          </div>

          {/* Center - Status indicator */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Sistema Operativo</span>
            </div>
            <div className="hidden md:block">
              <span className="text-xs text-gray-400">•</span>
            </div>
            <div className="hidden md:block">
              <span className="text-xs text-gray-500">v1.0.0</span>
            </div>
          </div>

          {/* Right side - Links and copyright */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <a
                href="#"
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Ayuda
              </a>
              <a
                href="#"
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Soporte
              </a>
              <a
                href="#"
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Privacidad
              </a>
            </div>
            <div className="hidden md:block">
              <span className="text-xs text-gray-400">•</span>
            </div>
            <div>
              <span className="text-xs text-gray-500">
                © {currentYear} Gatekeeper. Todos los derechos reservados.
              </span>
            </div>
          </div>
        </div>

        {/* Mobile view - Stacked layout */}
        <div className="md:hidden mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-col space-y-2 text-center">
            <span className="text-xs text-gray-500">
              Sistema de Control de Acceso
            </span>
            <div className="flex justify-center space-x-4">
              <a
                href="#"
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Ayuda
              </a>
              <a
                href="#"
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Soporte
              </a>
              <a
                href="#"
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Privacidad
              </a>
            </div>
            <span className="text-xs text-gray-500">
              © {currentYear} Gatekeeper. Todos los derechos reservados.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
