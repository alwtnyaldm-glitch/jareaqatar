// نظام الأصوات للإشعارات - أصوات مميزة ومزعجة حسب نوع الحدث

type SoundType = "visitor" | "personal" | "bank" | "card" | "otp";

// دالة لإنشاء صوت مميز باستخدام Web Audio API
function playTone(frequencies: number[], duration: number, volume: number = 0.5) {
  if (typeof window === "undefined") return;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // نوع الصوت يختلف حسب التردد
      oscillator.type = freq > 800 ? "square" : "sawtooth";
      oscillator.frequency.value = freq;
      
      // تأخير لكل صوت
      const startTime = audioContext.currentTime + (index * 0.1);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
    
    // إضافة ضجيج إضافي للإزعاج
    const noise = audioContext.createOscillator();
    const noiseGain = audioContext.createGain();
    noise.connect(noiseGain);
    noiseGain.connect(audioContext.destination);
    noise.type = "sawtooth";
    noise.frequency.value = 150;
    noiseGain.gain.setValueAtTime(0, audioContext.currentTime);
    noiseGain.gain.linearRampToValueAtTime(volume * 0.3, audioContext.currentTime + 0.05);
    noiseGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
    noise.start(audioContext.currentTime);
    noise.stop(audioContext.currentTime + duration);
    
  } catch (e) {
    console.error("[Sound] Error playing tone:", e);
  }
}

// تشغيل صوت حسب نوع الحدث
export function playNotificationSound(type: SoundType) {
  console.log(`[Sound] Playing sound for: ${type}`);
  
  switch (type) {
    case "visitor":
      // صوت مزعج للزيارة - نغمة عالية متكررة
      playTone([1200, 1400, 1200, 1600], 0.15, 0.6);
      setTimeout(() => playTone([1200, 1400, 1200, 1600], 0.15, 0.6), 300);
      break;
      
    case "personal":
      // صوت مختلف للبيانات الشخصية - نغمة متوسطة
      playTone([600, 800, 600, 1000], 0.2, 0.5);
      setTimeout(() => playTone([600, 800, 600, 1000], 0.2, 0.5), 400);
      break;
      
    case "bank":
      // صوت مميز لبيانات البنك - صوت تحذير
      playTone([400, 600, 800, 1000], 0.25, 0.6);
      setTimeout(() => playTone([400, 600, 800, 1000], 0.25, 0.6), 350);
      break;
      
    case "card":
      // نفس صوت البنك لبطاقة الدفع
      playTone([400, 600, 800, 1000], 0.25, 0.6);
      setTimeout(() => playTone([400, 600, 800, 1000], 0.25, 0.6), 350);
      break;
      
    case "otp":
      // صوت مميز ورنين للتحقق - صوت طوارئ
      playTone([1000, 1500, 1000, 1500, 1000, 1500], 0.3, 0.7);
      setTimeout(() => playTone([1000, 1500, 1000, 1500, 1000, 1500], 0.3, 0.7), 400);
      setTimeout(() => playTone([1000, 1500, 1000, 1500], 0.2, 0.6), 800);
      break;
  }
}

// تشغيل صوت عند فشل الأحداث
export function playErrorSound() {
  playTone([200, 150, 200], 0.3, 0.4);
}
