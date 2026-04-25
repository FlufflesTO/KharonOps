import React from "react";

export function TechHelpCard(): React.JSX.Element {
  return (
    <article className="premium-card glass overflow-hidden animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="p-6 border-b border-white/10 bg-white/5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-light/60 mb-1">Support & Operations</p>
        <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">Field Assistance</h2>
      </div>

      <div className="p-6 space-y-8">
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white/80 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              Office Control
            </h3>
            <p className="text-xs text-white/40 font-medium mt-1">Direct lines for dispatch and technical support.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group cursor-pointer">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-light/60">Dispatch</span>
              <p className="text-xl font-black text-white my-1 group-hover:text-primary transition-colors">011 123 4567</p>
              <span className="text-[10px] font-bold text-white/40 uppercase">Scheduling & Assignments</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group cursor-pointer">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-light/60">Technical</span>
              <p className="text-xl font-black text-white my-1 group-hover:text-primary transition-colors">011 123 4568</p>
              <span className="text-[10px] font-bold text-white/40 uppercase">System & Engineering Help</span>
            </div>
          </div>
        </section>

        <section className="space-y-4 pt-6 border-t border-white/5">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white/80 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              Standard Operating Procedures
            </h3>
            <p className="text-xs text-white/40 font-medium mt-1">Constitutional guides for platform tasks.</p>
          </div>
          
          <div className="space-y-3">
            <details className="group p-4 rounded-xl bg-black/40 border border-white/5 hover:border-white/20 transition-all cursor-pointer">
              <summary className="text-sm font-bold text-white/80 uppercase tracking-wider select-none outline-none flex justify-between items-center list-none">
                How to establish spatial presence?
                <svg className="w-4 h-4 text-white/40 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="mt-4 pt-4 border-t border-white/5 text-xs text-white/60 leading-relaxed font-medium">
                Select your job in "My Day", verify your location by clicking "Capture", and wait for the "Location Secure" signal before proceeding.
              </div>
            </details>
            
            <details className="group p-4 rounded-xl bg-black/40 border border-white/5 hover:border-white/20 transition-all cursor-pointer">
              <summary className="text-sm font-bold text-white/80 uppercase tracking-wider select-none outline-none flex justify-between items-center list-none">
                How to generate engineering documents?
                <svg className="w-4 h-4 text-white/40 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="mt-4 pt-4 border-t border-white/5 text-xs text-white/60 leading-relaxed font-medium">
                Navigate to the "Intelligence Brief", verify the site and job details, and select the specific SANS template from the Document Generation panel.
              </div>
            </details>
          </div>
        </section>
      </div>
    </article>
  );
}
