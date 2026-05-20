export default function BackgroundOrbs() {
  return (
    // Solo visible en sm+ — en mobile no renderiza orbs para no cargar la GPU
    <div className="hidden sm:block fixed inset-0 z-[-1] overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full
                      bg-blue-300/20 dark:bg-blue-700/15 blur-[100px]" />
      <div className="absolute top-1/3 -left-48 w-[500px] h-[500px] rounded-full
                      bg-violet-300/15 dark:bg-violet-700/12 blur-[100px]" />
      <div className="absolute -bottom-48 right-1/4 w-[550px] h-[550px] rounded-full
                      bg-rose-200/15 dark:bg-indigo-800/15 blur-[100px]" />
    </div>
  );
}
