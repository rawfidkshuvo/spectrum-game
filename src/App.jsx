import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  increment,
} from "firebase/firestore";
import {
  Target,
  Zap,
  Shield,
  History,
  Info,
  LogOut,
  X,
  Trophy,
  RotateCcw,
  User,
  CheckCircle,
  Settings,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Home,
  Layers,
  Sparkles,
  Minimize2,
  EyeOff,
  Activity,
  Cpu,
  Unplug,
  FastForward,
  Signal,
  Inbox,
  Battery,
  Hammer,
  Trash2, // Added Trash2 icon for the kick button
} from "lucide-react";

// --- Firebase Config & Init ---
// Using environment config for compatibility with the preview environment
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyBjIjK53vVJW1y5RaqEFGSFp0ECVDBEe1o",
  authDomain: "game-hub-ff8aa.firebaseapp.com",
  projectId: "game-hub-ff8aa",
  storageBucket: "game-hub-ff8aa.firebasestorage.app",
  messagingSenderId: "586559578902",
  appId: "1:586559578902:web:2f012b1619cb4ef46aa637",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "spectrum-fives";
const GAME_ID = "24";

// --- Game Constants ---
const SUITS = {
  BLUE: {
    name: "Blue",
    color: "text-blue-400",
    bg: "bg-blue-900/40",
    border: "border-blue-500",
    icon: Activity,
  },
  GREEN: {
    name: "Green",
    color: "text-emerald-400",
    bg: "bg-emerald-900/40",
    border: "border-emerald-500",
    icon: Cpu,
  },
  MAGENTA: {
    name: "Magenta",
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-900/40",
    border: "border-fuchsia-500",
    icon: Target,
  },
  SILVER: {
    name: "Silver",
    color: "text-slate-200",
    bg: "bg-slate-700/40",
    border: "border-slate-400",
    icon: Zap,
  },
};

const SUIT_ORDER = { BLUE: 0, GREEN: 1, MAGENTA: 2, SILVER: 3 };

// --- Helper Functions ---
const shuffle = (array) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

// --- Sub-Components ---

const FeedbackOverlay = ({ type, message, subtext, icon: Icon }) => (
  <div className="fixed inset-0 z-[160] flex items-center justify-center pointer-events-none">
    <div
      className={`flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl border-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] transform transition-all animate-in fade-in zoom-in slide-in-from-bottom-10 duration-300 backdrop-blur-md
      ${
        type === "success"
          ? "bg-fuchsia-900/90 border-fuchsia-500 text-fuchsia-100"
          : ""
      }
      ${type === "failure" ? "bg-red-900/90 border-red-500 text-red-100" : ""}
      ${
        type === "neutral"
          ? "bg-slate-900/90 border-slate-500 text-slate-100"
          : ""
      }
    `}
    >
      {Icon && (
        <div className="mb-4 p-4 bg-black/30 rounded-full border-2 border-white/20">
          <Icon size={64} className="animate-bounce text-fuchsia-400" />
        </div>
      )}
      <h2 className="text-3xl md:text-5xl font-black uppercase tracking-widest text-center drop-shadow-lg mb-2">
        {message}
      </h2>
      {subtext && (
        <p className="text-lg md:text-xl font-bold opacity-90 tracking-wide text-center">
          {subtext}
        </p>
      )}
    </div>
  </div>
);

const FloatingBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-950/20 via-gray-950 to-black" />
    <div className="absolute top-0 left-0 w-full h-full bg-fuchsia-900/5 mix-blend-overlay" />
    <div
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage:
          'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")',
      }}
    ></div>
  </div>
);

const SpectrumLogo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Target size={12} className="text-fuchsia-500" />
    <span className="text-[10px] font-black tracking-widest text-fuchsia-500 uppercase">
      SPECTRUM
    </span>
  </div>
);

const LeaveConfirmModal = ({
  onConfirmLeave,
  onConfirmLobby,
  onCancel,
  isHost,
  inGame,
}) => (
  <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-sm w-full text-center shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-2 font-serif">
        Abort Frequency?
      </h3>
      <p className="text-gray-400 mb-6 text-sm">
        {isHost
          ? "WARNING: As Host, shutting down the server will disconnect all users."
          : inGame
          ? "Leaving now will destabilize the session for all observers!"
          : "Disconnecting from the backroom..."}
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-bold transition-colors"
        >
          Stay Sync'd
        </button>
        {inGame && isHost && (
          <button
            onClick={onConfirmLobby}
            className="py-3 rounded font-bold bg-fuchsia-700 hover:bg-fuchsia-600 text-white flex items-center justify-center gap-2 transition-colors"
          >
            <Home size={18} /> Return to Backroom
          </button>
        )}
        <button
          onClick={onConfirmLeave}
          className="bg-red-600 hover:bg-red-500 text-white py-3 rounded font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut size={18} /> {isHost ? "Shut Down Server" : "Sever Connection"}
        </button>
      </div>
    </div>
  </div>
);

const CardDisplay = ({
  suit,
  val,
  faceDown,
  onClick,
  disabled,
  highlight,
  small,
  tiny,
}) => {
  const suitInfo = faceDown ? SUITS.MAGENTA : SUITS[suit] || SUITS.MAGENTA;
  const displayVal = faceDown ? 5 : val;
  const SuitIcon = suitInfo.icon;

  if (tiny) {
    return (
      <div
        className={`w-6 h-8 rounded border flex items-center justify-center ${suitInfo.bg} ${suitInfo.border} shadow-sm`}
        title={suit}
      >
        <span className={`text-[10px] font-black ${suitInfo.color}`}>
          {displayVal}
        </span>
      </div>
    );
  }

  const sizeClasses = small ? "w-16 h-24 p-2" : "w-24 h-36 md:w-32 md:h-48 p-3";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative rounded-xl border-2 shadow-lg transition-all flex flex-col items-center justify-between overflow-hidden
        ${sizeClasses} ${suitInfo.bg} ${suitInfo.border}
        ${highlight ? "ring-4 ring-fuchsia-400 scale-105 z-10" : ""}
        ${
          disabled
            ? "opacity-50 cursor-not-allowed grayscale"
            : "hover:scale-105 cursor-pointer"
        }
      `}
    >
      {faceDown && (
        <div className="absolute inset-0 bg-fuchsia-600/10 flex items-center justify-center pointer-events-none">
          <EyeOff size={48} className="text-fuchsia-500/10" />
        </div>
      )}
      <div
        className={`w-full flex justify-between font-black ${
          small ? "text-xs" : "text-lg"
        } ${suitInfo.color}`}
      >
        <span>{displayVal}</span>
        <Target size={small ? 12 : 16} opacity={0.3} />
      </div>
      <div className="flex flex-col items-center">
        <SuitIcon size={small ? 20 : 32} className={`${suitInfo.color} mb-1`} />
        {!small && (
          <span
            className={`text-[8px] uppercase tracking-widest font-black ${suitInfo.color} opacity-60`}
          >
            {faceDown ? "MAGENTA 5" : suitInfo.name}
          </span>
        )}
      </div>
      <div
        className={`w-full flex justify-start font-black ${
          small ? "text-xs" : "text-lg"
        } ${suitInfo.color} rotate-180`}
      >
        <span>{displayVal}</span>
      </div>
    </button>
  );
};

const RulesModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/95 z-[150] flex items-center justify-center p-0 md:p-4">
    <div className="bg-gray-900 md:rounded-2xl w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] overflow-hidden border border-fuchsia-500/30 shadow-2xl flex flex-col">
      <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950">
        <div className="flex flex-col">
          <h2 className="text-2xl md:text-3xl font-black text-fuchsia-500 uppercase tracking-widest font-serif">
            SYSTEM OVERVIEW
          </h2>
          <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">
            Spectrum Protocol
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
        >
          <X />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 text-gray-300">
        <div className="bg-fuchsia-950/20 p-6 rounded-xl border border-fuchsia-500/20">
          <h3 className="text-xl font-bold text-fuchsia-400 mb-2 flex items-center gap-2 font-serif">
            <Target size={20} /> Target: Equilibrium 25
          </h3>
          <p className="text-sm md:text-base leading-relaxed opacity-80">
            Win tricks to collect cards. Your cumulative score must reach{" "}
            <strong>25</strong>. Exceeding 25 causes a{" "}
            <strong>System Overload (Bust)</strong>—you lose chips and forfeit
            the round score.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-bold text-white uppercase text-[10px] tracking-widest border-b border-gray-800 pb-2">
              Trick Mechanisms
            </h4>
            <ul className="space-y-3 text-xs md:text-sm">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />{" "}
                Must follow lead suit if possible.
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />{" "}
                <strong>Silver</strong> is always Trump.
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1.5 shrink-0" />{" "}
                Highest card of lead suit (or Trump) takes the trick.
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-fuchsia-400 uppercase text-[10px] tracking-widest border-b border-fuchsia-900/50 pb-2">
              The Magenta 5 Override
            </h4>
            <ul className="space-y-3 text-xs md:text-sm">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1.5 shrink-0" />{" "}
                Any card can be played <strong>Face-Down</strong> as a Magenta
                5.
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1.5 shrink-0" />{" "}
                Allowed only if unable to follow suit OR if it's your final card
                of that suit.
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1.5 shrink-0" />{" "}
                Only <strong>one</strong> Magenta 5 per trick.
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="p-6 bg-gray-950 border-t border-gray-800 text-center">
        <button
          onClick={onClose}
          className="w-full md:w-auto bg-fuchsia-700 hover:bg-fuchsia-600 text-white px-16 py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-fuchsia-900/20"
        >
          Engage
        </button>
      </div>
    </div>
  </div>
);

// --- Main Component ---
export default function SpectrumGame() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("menu");
  const [playerName, setPlayerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomId, setRoomId] = useState("");
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRules, setShowRules] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [feedbackOverlay, setFeedbackOverlay] = useState(null);
  const [playMode, setPlayMode] = useState("NORMAL");

  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- Session Restoration ---
  useEffect(() => {
    const savedRoomId = localStorage.getItem("spectrum_roomId");
    if (savedRoomId) {
      setRoomId(savedRoomId);
      // We assume the snapshot listener will pick up the state and set the view correctly
    }
  }, []);

  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();

          // --- KICK CHECK: If I am not in the player list, return to menu ---
          const amIInRoom = data.players.some((p) => p.id === user.uid);
          if (!amIInRoom) {
            setRoomId("");
            setView("menu");
            localStorage.removeItem("spectrum_roomId"); // Clear Session
            setError("Signal Lost: Kicked by Host");
            return;
          }
          // -----------------------------------------------------------------

          setGameState(data);
          if (data.status === "playing") setView("game");
          else if (data.status === "lobby") setView("lobby");
          else if (data.status === "finished") setView("game");
        } else {
          setRoomId("");
          setView("menu");
          localStorage.removeItem("spectrum_roomId"); // Clear Session
          setError("Synchronicity Terminated (Room Closed)");
        }
      }
    );
    return () => unsub();
  }, [roomId, user]);

  useEffect(() => {
    if (!gameState || !user || gameState.status !== "playing") return;
    const isHost = gameState.hostId === user.uid;
    if (isHost && gameState.trick.length === gameState.players.length) {
      const timer = setTimeout(() => {
        resolveTrick(gameState.trick, gameState.players, gameState.leadSuit);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [gameState?.trick?.length, user?.uid, gameState?.status]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "game_hub_settings", "config"), (doc) => {
      if (doc.exists() && doc.data()[GAME_ID]?.maintenance)
        setIsMaintenance(true);
      else setIsMaintenance(false);
    });
    return () => unsub();
  }, []);

  const triggerFeedback = (type, message, subtext = "", Icon = null) => {
    setFeedbackOverlay({ type, message, subtext, icon: Icon });
    setTimeout(() => setFeedbackOverlay(null), 2000);
  };

  const createRoom = async () => {
    if (!playerName) return setError("Identifier Required");
    setLoading(true);
    const newId = Math.random().toString(36).substring(2, 7).toUpperCase();
    const initialData = {
      roomId: newId,
      hostId: user.uid,
      status: "lobby",
      players: [
        {
          id: user.uid,
          name: playerName,
          chips: 5,
          hand: [],
          scorePile: [],
          scoreTotal: 0,
          busted: false,
          ready: false,
        },
      ],
      deck: [],
      trick: [],
      leadSuit: null,
      turnIndex: 0,
      roundCount: 1,
      logs: [],
      reserve: 0,
    };
    await setDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId),
      initialData
    );
    localStorage.setItem("spectrum_roomId", newId); // Save Session
    setRoomId(newId);
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCodeInput || !playerName) return setError("Protocol Data Missing");
    setLoading(true);
    const ref = doc(
      db,
      "artifacts",
      APP_ID,
      "public",
      "data",
      "rooms",
      roomCodeInput
    );
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      setError("Frequency not found");
      setLoading(false);
      return;
    }
    const data = snap.data();
    if (data.status !== "lobby") {
      setError("Session locked");
      setLoading(false);
      return;
    }
    if (data.players.length >= 4) {
      setError("Backroom Full");
      setLoading(false);
      return;
    }
    const newPlayers = [
      ...data.players,
      {
        id: user.uid,
        name: playerName,
        chips: 5,
        hand: [],
        scorePile: [],
        scoreTotal: 0,
        busted: false,
        ready: false,
      },
    ];
    await updateDoc(ref, { players: newPlayers });
    localStorage.setItem("spectrum_roomId", roomCodeInput); // Save Session
    setRoomId(roomCodeInput);
    setLoading(false);
  };

  const startRound = async () => {
    if (!gameState || gameState.hostId !== user.uid) return;
    const playerCount = gameState.players.length;
    const cardsPerSuit = playerCount === 3 ? 9 : 13;
    const deck = [];
    Object.keys(SUITS).forEach((suitKey) => {
      for (let i = 1; i <= cardsPerSuit; i++) {
        deck.push({ suit: suitKey, val: i });
      }
    });
    const shuffled = shuffle(deck);
    const handSize = Math.floor(shuffled.length / playerCount);
    const players = gameState.players.map((p) => {
      const hand = [];
      for (let i = 0; i < handSize; i++) {
        hand.push(shuffled.pop());
      }
      return {
        ...p,
        hand,
        scorePile: [],
        scoreTotal: 0,
        busted: false,
        ready: false,
      };
    });
    const isNextRound =
      gameState.status === "playing" || gameState.turnIndex === null;
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        deck: shuffled,
        players,
        trick: [],
        leadSuit: null,
        turnIndex: 0,
        roundResult: null,
        roundCount: isNextRound ? increment(1) : gameState.roundCount,
        logs: arrayUnion({
          text: `Initialized Frequency Sync: Round ${
            isNextRound ? gameState.roundCount + 1 : gameState.roundCount
          }`,
          type: "neutral",
        }),
      }
    );
  };

  const restartGame = async () => {
    if (!gameState || gameState.hostId !== user.uid) return;
    const playerCount = gameState.players.length;
    const cardsPerSuit = playerCount === 3 ? 9 : 13;
    const deck = [];
    Object.keys(SUITS).forEach((suitKey) => {
      for (let i = 1; i <= cardsPerSuit; i++) {
        deck.push({ suit: suitKey, val: i });
      }
    });
    const shuffled = shuffle(deck);
    const handSize = Math.floor(shuffled.length / playerCount);
    const resetPlayers = gameState.players.map((p) => {
      const hand = [];
      for (let i = 0; i < handSize; i++) {
        hand.push(shuffled.pop());
      }
      return {
        ...p,
        chips: 5,
        hand,
        scorePile: [],
        scoreTotal: 0,
        busted: false,
        ready: false,
      };
    });
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        deck: shuffled,
        players: resetPlayers,
        trick: [],
        leadSuit: null,
        turnIndex: 0,
        roundCount: 1,
        reserve: 0,
        roundResult: null,
        logs: [
          {
            text: "--- GRID REBOOTED: COMMENCING NEW OPERATION ---",
            type: "neutral",
          },
        ],
      }
    );
    setShowLeaveConfirm(false);
  };

  const setPlayerReady = async () => {
    if (!gameState) return;
    const updatedPlayers = gameState.players.map((p) =>
      p.id === user.uid ? { ...p, ready: true } : p
    );
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players: updatedPlayers,
      }
    );
  };

  const playCard = async (index, faceDown) => {
    if (
      !gameState ||
      gameState.turnIndex === null ||
      gameState.players[gameState.turnIndex].id !== user.uid
    )
      return;
    const me = gameState.players[gameState.turnIndex];
    const card = me.hand[index];

    if (gameState.trick.length > 0 && !faceDown) {
      const hasSuit = me.hand.some((c) => c.suit === gameState.leadSuit);
      if (hasSuit && card.suit !== gameState.leadSuit) {
        triggerFeedback("failure", "DESYNC", "Must maintain lead frequency!");
        return;
      }
    }

    if (faceDown) {
      const hasSuit = me.hand.some((c) => c.suit === gameState.leadSuit);
      const isLastOfSuit =
        me.hand.filter((c) => c.suit === gameState.leadSuit).length === 1 &&
        card.suit === gameState.leadSuit;
      const magentaExists = gameState.trick.some((t) => t.faceDown);

      if (magentaExists) {
        triggerFeedback("failure", "JAMMED", "One Magenta Override limit!");
        return;
      }
      if (gameState.trick.length > 0 && hasSuit && !isLastOfSuit) {
        triggerFeedback(
          "failure",
          "INVALID MASK",
          "Cannot mask if able to follow."
        );
        return;
      }
    }

    const updatedPlayers = [...gameState.players];
    const playerIdx = gameState.turnIndex;
    updatedPlayers[playerIdx].hand.splice(index, 1);
    const trickCard = {
      playerId: user.uid,
      playerName: me.name,
      suit: card.suit,
      val: card.val,
      faceDown,
    };
    const newTrick = [...gameState.trick, trickCard];
    let newLeadSuit = gameState.leadSuit;

    if (gameState.trick.length === 0) {
      newLeadSuit = faceDown ? "MAGENTA" : card.suit;
    }

    // --- FIX START: PREVENT PREMATURE TURN ADVANCE ---
    const isTrickComplete = newTrick.length === gameState.players.length;
    // If trick is complete, pause the turn (set to -1) until resolution.
    // If trick is NOT complete, move to next player normally.
    const nextTurn = isTrickComplete
      ? -1
      : (gameState.turnIndex + 1) % gameState.players.length;
    // --- FIX END ---

    const logText = faceDown
      ? `📡 ${me.name} initiated MAGENTA_OVERRIDE (MASKED)`
      : `📡 ${me.name} transmitted signal: ${card.suit} ${card.val}`;
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players: updatedPlayers,
        trick: newTrick,
        leadSuit: newLeadSuit,
        turnIndex: nextTurn,
        logs: arrayUnion({ text: logText, type: "neutral" }),
      }
    );
    setPlayMode("NORMAL");
  };

  const resolveTrick = async (trick, currentPlayers, leadSuit) => {
    let winnerId = trick[0].playerId;
    let highestVal = -1;

    const trumps = trick.filter((t) => t.suit === "SILVER" && !t.faceDown);
    if (trumps.length > 0) {
      highestVal = Math.max(...trumps.map((t) => t.val));
      winnerId = trumps.find((t) => t.val === highestVal).playerId;
    } else {
      const valid = trick.filter(
        (t) =>
          (t.suit === leadSuit && !t.faceDown) ||
          (t.faceDown && leadSuit === "MAGENTA")
      );
      if (valid.length > 0) {
        highestVal = Math.max(...valid.map((t) => (t.faceDown ? 5 : t.val)));
        winnerId = valid.find(
          (t) => (t.faceDown ? 5 : t.val) === highestVal
        ).playerId;
      }
    }

    const winnerIdx = currentPlayers.findIndex((p) => p.id === winnerId);
    const winningCard = trick.find((t) => t.playerId === winnerId);
    const cardValAdded = winningCard.faceDown ? 5 : winningCard.val;

    const newLogs = [];
    const updatedPlayers = currentPlayers.map((p, idx) => {
      if (idx === winnerIdx) {
        const nt = p.scoreTotal + cardValAdded;
        if (nt > 25) {
          newLogs.push({
            text: `⚠️ SYSTEM_OVERLOAD: ${p.name} BUSTED at ${nt} Equilibrium`,
            type: "danger",
          });
        }
        return {
          ...p,
          scorePile: [...p.scorePile, winningCard],
          scoreTotal: nt,
          busted: nt > 25,
        };
      }
      return p;
    });
    const roundEnds = updatedPlayers.every((p) => p.hand.length === 0);

    if (roundEnds) {
      const finalPlayers = JSON.parse(JSON.stringify(updatedPlayers));
      const playerCount = finalPlayers.length;
      const rewards = playerCount === 3 ? [2, 1, 0] : [3, 2, 1, 0];
      const scoreGroups = {};
      finalPlayers
        .filter((p) => !p.busted)
        .forEach((p) => {
          const diff = Math.abs(25 - p.scoreTotal);
          if (!scoreGroups[diff]) scoreGroups[diff] = [];
          scoreGroups[diff].push(p.id);
        });
      const sortedDiffs = Object.keys(scoreGroups)
        .map(Number)
        .sort((a, b) => a - b);
      let nextReserve = gameState.reserve || 0;
      const firstPlaceWinners = scoreGroups[sortedDiffs[0]] || [];
      const singleWinner = firstPlaceWinners.length === 1;
      let currentRank = 0;
      sortedDiffs.forEach((diff) => {
        const unitsInTie = scoreGroups[diff].length;
        const rewardValue = rewards[currentRank] || 0;
        const rankLabel =
          ["1st", "2nd", "3rd", "4th"][currentRank] || `${currentRank + 1}th`;

        scoreGroups[diff].forEach((pid) => {
          const pIdx = finalPlayers.findIndex((x) => x.id === pid);
          finalPlayers[pIdx].chips += rewardValue;

          newLogs.push({
            text: `📊 ${finalPlayers[pIdx].name} placed ${rankLabel} (${finalPlayers[pIdx].scoreTotal} pts) -> +${rewardValue} chips`,
            type: "success",
          });

          if (diff === 0) {
            if (singleWinner) {
              finalPlayers[pIdx].chips += 1;
              newLogs.push({
                text: `🎯 PERFECT_SYNC: ${finalPlayers[pIdx].name} hit 25! (+1 bonus)`,
                type: "success",
              });
            } else {
              nextReserve += 1;
              newLogs.push({
                text: `🔋 TIE_OVERFLOW: Tied perfect score of 25. 1 bonus moved to Extra Chips tray.`,
                type: "neutral",
              });
            }
          }
        });
        currentRank += unitsInTie;
      });

      finalPlayers.forEach((p, i) => {
        if (p.busted) {
          finalPlayers[i].chips -= 1;
          nextReserve += 1;
          newLogs.push({
            text: `⚠️ SYSTEM_BUST: ${p.name} (${p.scoreTotal} pts) forfeited 1 chip to Extra Chips tray.`,
            type: "danger",
          });
        }
      });
      if (singleWinner) {
        const winIdx = finalPlayers.findIndex(
          (x) => x.id === firstPlaceWinners[0]
        );
        if (nextReserve > 0) {
          newLogs.push({
            text: `⚡ RESERVE_ACQUIRED: ${finalPlayers[winIdx].name} collected ${nextReserve} Extra Chips!`,
            type: "success",
          });
          finalPlayers[winIdx].chips += nextReserve;
          nextReserve = 0;
        }
      } else if (nextReserve > 0) {
        newLogs.push({
          text: `🔋 TRAY_UPDATE: Extra Chips tray now at ${nextReserve} units (Tied Winner Lock)`,
          type: "neutral",
        });
      }

      const isLastRound = gameState.roundCount >= 4;
      if (isLastRound && !singleWinner && nextReserve > 0) {
        newLogs.push({
          text: `💥 SYSTEM_FLUSH: ${nextReserve} Extra Chips destroyed (No Clear Protocol Victor)`,
          type: "danger",
        });
        nextReserve = 0;
      }

      const gameFinished =
        isLastRound || finalPlayers.some((p) => p.chips >= 25);

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: finalPlayers,
          trick: [],
          leadSuit: null,
          status: gameFinished ? "finished" : "playing",
          turnIndex: null,
          reserve: nextReserve,
          roundResult: {
            closest:
              firstPlaceWinners.length > 1
                ? "MULTIPLE_UNITS"
                : finalPlayers.find((p) => p.id === firstPlaceWinners[0])
                    ?.name || "NONE",
            total: sortedDiffs[0] !== undefined ? 25 - sortedDiffs[0] : 0,
            reserve: nextReserve,
          },
          logs: arrayUnion(...newLogs, {
            text: `--- Calibration Phase ${gameState.roundCount} Finalized ---`,
            type: "neutral",
          }),
        }
      );
    } else {
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: updatedPlayers,
          trick: [],
          leadSuit: null,
          turnIndex: winnerIdx,
          logs: arrayUnion(...newLogs, {
            text: `✅ Trick secured by ${updatedPlayers[winnerIdx].name} (+${cardValAdded})`,
            type: "success",
          }),
        }
      );
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId) return;
    const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId);
    try {
      if (gameState?.hostId === user.uid) {
        await deleteDoc(ref);
      } else {
        const newPlayers = gameState.players.filter((p) => p.id !== user.uid);
        await updateDoc(ref, { players: newPlayers });
      }
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("spectrum_roomId"); // Clear Session
    setRoomId("");
    setView("menu");
    setShowLeaveConfirm(false);
  };

  // --- Kick Player Function ---
  const kickPlayer = async (playerIdToRemove) => {
    if (!gameState || gameState.hostId !== user.uid) return;

    const newPlayers = gameState.players.filter(
      (p) => p.id !== playerIdToRemove
    );

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players: newPlayers }
    );
  };

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <div className="bg-orange-500/10 p-8 rounded-2xl border border-orange-500/30">
          <Hammer
            size={64}
            className="text-orange-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-3xl font-bold mb-2">Under Maintenance</h1>
          <p className="text-gray-400">
            The system is running short of chips. Wait until new chips are built
            and delivered.
          </p>
        </div>
        {/* Add Spacing Between Boxes */}
        <div className="h-8"></div>

        {/* Clickable Second Card */}
        <a href="https://rawfidkshuvo.github.io/gamehub/">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-center pb-12 animate-pulse">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900/50 rounded-full border border-indigo-500/20 text-indigo-300 font-bold tracking-widest text-sm uppercase backdrop-blur-sm">
                <Sparkles size={16} /> Visit Gamehub...Try our other releases...{" "}
                <Sparkles size={16} />
              </div>
            </div>
          </div>
        </a>
      </div>
    );
  }

  if (!user)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-fuchsia-500 font-serif">
        BOOTING_PROTOCOL...
      </div>
    );
  if (view === "menu") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <FloatingBackground />
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
        <div className="z-10 text-center mb-10 animate-in fade-in zoom-in duration-700">
          <Target
            size={64}
            className="text-fuchsia-500 mx-auto mb-4 animate-pulse drop-shadow-[0_0_20px_rgba(217,70,239,0.4)]"
          />
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-fuchsia-300 to-fuchsia-600 font-serif tracking-[0.2em]">
            SPECTRUM
          </h1>
          <p className="text-fuchsia-500/30 tracking-[0.6em] uppercase mt-2 text-[10px] font-black">
            MAGENTA_EQUILIBRIUM
          </p>
        </div>
        <div className="bg-gray-900/90 backdrop-blur-md border border-fuchsia-500/20 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10">
          {error && (
            <div className="bg-red-900/40 text-red-200 p-3 mb-4 rounded border border-red-800 text-center text-xs">
              {error}
            </div>
          )}
          <input
            className="w-full bg-black/60 border border-gray-700 p-3 rounded mb-4 text-white placeholder-gray-600 focus:border-fuchsia-500 outline-none transition-all uppercase font-mono tracking-widest text-sm"
            placeholder="AGENT_IDENTIFIER"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-fuchsia-700 hover:bg-fuchsia-600 p-4 rounded-xl font-black mb-4 flex items-center justify-center gap-2 shadow-lg tracking-widest uppercase transition-all text-sm"
          >
            <Target size={18} /> Establish Grid
          </button>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              className="w-full sm:flex-1 bg-black/60 border border-gray-700 p-3 rounded text-white placeholder-gray-600 uppercase font-mono tracking-widest text-sm outline-none"
              placeholder="ROOM_CODE"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 border border-gray-700 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest"
            >
              Infiltrate
            </button>
          </div>
          <button
            onClick={() => setShowRules(true)}
            className="w-full text-[10px] text-gray-500 hover:text-fuchsia-400 flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            <BookOpen size={14} /> View Manual
          </button>
        </div>
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 relative">
        <FloatingBackground />
        <div className="z-10 w-full max-w-lg bg-gray-900/95 backdrop-blur-xl p-8 rounded-2xl border border-fuchsia-900/30 shadow-2xl">
          <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
            <h2 className="text-xl font-serif text-fuchsia-500 tracking-wider">
              Frequency: <span className="text-white font-mono">{roomId}</span>
            </h2>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 bg-red-900/20 hover:bg-red-900/40 rounded text-red-400 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
          <div className="space-y-3 mb-10">
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-gray-800"
              >
                <span
                  className={`font-black flex items-center gap-2 text-sm uppercase tracking-widest ${
                    p.id === user.uid ? "text-fuchsia-400" : "text-gray-400"
                  }`}
                >
                  <User size={14} /> {p.name}{" "}
                  {p.id === gameState.hostId && (
                    <Sparkles size={14} className="text-yellow-500" />
                  )}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-green-500 text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 animate-pulse">
                    <CheckCircle size={10} /> Active
                  </span>
                  {/* --- KICK BUTTON --- */}
                  {isHost && p.id !== gameState.hostId && (
                    <button
                      onClick={() => kickPlayer(p.id)}
                      className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-all"
                      title="Kick Player"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {isHost ? (
            <button
              onClick={startRound}
              disabled={gameState.players.length < 3}
              className={`w-full py-5 rounded-xl font-black uppercase tracking-[0.2em] transition-all shadow-xl ${
                gameState.players.length >= 3
                  ? "bg-fuchsia-700 hover:bg-fuchsia-600 text-white shadow-fuchsia-900/20"
                  : "bg-gray-800 text-gray-600 cursor-not-allowed"
              }`}
            >
              {gameState.players.length < 3
                ? "Awaiting Data (3-4 Required)"
                : "Commence Protocol"}
            </button>
          ) : (
            <div className="text-center text-fuchsia-500/50 animate-pulse font-serif italic text-sm">
              Synchronizing with host authority...
            </div>
          )}
        </div>
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onCancel={() => setShowLeaveConfirm(false)}
            onConfirmLeave={handleLeaveRoom}
            isHost={isHost}
          />
        )}
        <SpectrumLogo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const me = gameState.players.find((p) => p.id === user.uid);
    if (!me) return null;

    const isMyTurn =
      gameState.turnIndex !== null &&
      gameState.turnIndex !== -1 && // Prevent play during resolution phase
      gameState.players[gameState.turnIndex]?.id === user.uid;
    const isHost = gameState.hostId === user.uid;
    const isRoundOver =
      gameState.turnIndex === null && gameState.status === "playing";
    const sortedHand = me
      ? [...me.hand]
          .map((card, originalIdx) => ({ ...card, originalIdx }))
          .sort((a, b) => {
            if (SUIT_ORDER[a.suit] !== SUIT_ORDER[b.suit])
              return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
            return a.val - b.val;
          })
      : [];
    const allGuestsReady = gameState.players
      .filter((p) => p.id !== gameState.hostId)
      .every((p) => p.ready);
    const victor = [...gameState.players].sort((a, b) => b.chips - a.chips)[0];

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden font-sans">
        <FloatingBackground />
        {feedbackOverlay && <FeedbackOverlay {...feedbackOverlay} />}
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}

        {showLeaveConfirm && (
          <LeaveConfirmModal
            onCancel={() => setShowLeaveConfirm(false)}
            onConfirmLeave={handleLeaveRoom}
            onConfirmLobby={() => {
              const resetPlayers = gameState.players.map((p) => ({
                ...p,
                ready: false,
              }));
              updateDoc(
                doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
                {
                  status: "lobby",
                  roundCount: 1,
                  roundResult: null,
                  reserve: 0,
                  players: resetPlayers,
                }
              );
              setShowLeaveConfirm(false);
            }}
            isHost={isHost}
            inGame
          />
        )}

        <div className="h-14 bg-gray-950/90 border-b border-fuchsia-900/30 flex items-center justify-between px-4 z-50 backdrop-blur-md sticky top-0">
          <div className="flex items-center gap-2 font-serif font-black text-fuchsia-500 tracking-[0.2em]">
            SPECTRUM{" "}
            <span className="text-[10px] text-gray-500 font-sans tracking-widest ml-1 opacity-70">
              (ROUND {gameState.roundCount})
            </span>
          </div>
          <div className="flex gap-2">
            {gameState.reserve > 0 && (
              <div className="flex items-center gap-1.5 bg-fuchsia-900/40 px-3 py-1 rounded-full border border-fuchsia-500/30 mr-2 animate-in fade-in slide-in-from-right-4 duration-500">
                <Battery size={12} className="text-fuchsia-400" />
                <span className="text-[10px] font-black text-fuchsia-300 uppercase tracking-tighter">
                  EXTRA_CHIPS: {gameState.reserve}
                </span>
              </div>
            )}
            <button
              onClick={() => setShowRules(true)}
              className="p-2 hover:bg-gray-800 rounded text-gray-400 transition-colors"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="p-2 hover:bg-gray-800 rounded text-gray-400 transition-colors"
            >
              <History size={18} />
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 hover:bg-red-900/40 rounded text-red-400 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 p-2 md:p-4 flex flex-col items-center justify-between relative z-10 w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full justify-center">
            {gameState.players.map((p, i) => {
              if (p.id === user.uid) return null;
              const isActive = gameState.turnIndex === i;
              return (
                <div
                  key={p.id}
                  className={`bg-black/60 p-3 rounded-xl border-2 transition-all 
                  ${
                    isActive
                      ? "border-fuchsia-500 scale-105 shadow-xl shadow-fuchsia-900/40 animate-pulse"
                      : "border-gray-800"
                  } 
                  ${p.busted ? "opacity-30 grayscale" : ""}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-[10px] uppercase tracking-wider truncate max-w-[70px]">
                      {p.name}
                    </span>
                    <div className="flex gap-1 items-center bg-gray-900 px-2 rounded-full border border-gray-700">
                      <Sparkles size={8} className="text-yellow-400" />
                      <span className="text-[10px] font-mono">{p.chips}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex -space-x-3">
                      {p.hand.map((_, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-6 bg-fuchsia-950 rounded border border-fuchsia-800"
                        />
                      ))}
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-[10px] font-black tracking-tighter ${
                          p.busted ? "text-red-500" : "text-fuchsia-400"
                        }`}
                      >
                        EQ: {p.scoreTotal}
                      </div>
                      <div className="flex gap-0.5 justify-end">
                        {p.scorePile.slice(-2).map((c, idx) => (
                          <CardDisplay key={idx} {...c} tiny />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center w-full relative">
            {isRoundOver && gameState.roundResult && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-3xl border border-fuchsia-500/20 animate-in fade-in zoom-in duration-500">
                <div className="text-center">
                  <div className="bg-fuchsia-600 text-white text-[10px] font-black uppercase px-4 py-1 rounded-full mb-4 inline-block tracking-widest shadow-lg">
                    Phase Summary
                  </div>
                  <h2 className="text-3xl font-serif font-black text-white mb-2 uppercase">
                    {gameState.roundResult.closest}
                  </h2>
                  <p className="text-fuchsia-400 font-mono text-xs mb-2 uppercase tracking-tighter">
                    Achieved Equilibrium ({gameState.roundResult.total}/25)
                  </p>
                  {gameState.roundResult.reserve > 0 && (
                    <p className="text-gray-500 font-mono text-[10px] mb-8 uppercase tracking-widest">
                      Extra Chips Tray: {gameState.roundResult.reserve} units
                    </p>
                  )}
                  <div className="mt-8">
                    {isHost ? (
                      <button
                        onClick={startRound}
                        className="bg-fuchsia-700 hover:bg-fuchsia-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-fuchsia-900/30 transition-all"
                      >
                        <FastForward size={20} /> Initialize Phase{" "}
                        {gameState.roundCount + 1}
                      </button>
                    ) : (
                      <div className="text-gray-500 font-black animate-pulse uppercase tracking-[0.2em] text-[10px]">
                        Awaiting host frequency shift...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="relative w-full max-w-md flex flex-wrap gap-4 justify-center items-center">
              {gameState.trick.map((c, idx) => (
                <div
                  key={idx}
                  className="animate-in zoom-in slide-in-from-bottom-4 duration-500"
                >
                  <div className="text-[10px] text-gray-500 uppercase font-black text-center mb-1 tracking-tighter truncate w-24">
                    {c.playerName}
                  </div>
                  <CardDisplay {...c} small />
                </div>
              ))}
              {gameState.trick.length === 0 && !isRoundOver && (
                <div className="text-gray-800 uppercase tracking-[0.5em] font-black text-center opacity-40 select-none flex flex-col items-center">
                  <Activity size={64} className="mb-4 text-fuchsia-900" />
                  IDLE_GRID
                </div>
              )}
            </div>
            {gameState.leadSuit && !isRoundOver && (
              <div className="mt-8 bg-gray-900/80 border border-fuchsia-500/20 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                Protocol:{" "}
                <span className={SUITS[gameState.leadSuit]?.color}>
                  {SUITS[gameState.leadSuit]?.name}
                </span>
              </div>
            )}
          </div>

          <div className="w-full bg-gray-900/98 border-t-2 border-fuchsia-500/20 p-4 md:p-6 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`px-5 py-3 rounded-2xl flex items-center gap-3 border transition-all ${
                    me.busted
                      ? "bg-red-950/40 border-red-500 shadow-red-900/20"
                      : "bg-fuchsia-950/40 border-fuchsia-500 shadow-fuchsia-900/20"
                  }`}
                >
                  <Activity
                    className={me.busted ? "text-red-500" : "text-fuchsia-400"}
                    size={24}
                  />
                  <div className="flex flex-col">
                    <span
                      className={`text-2xl font-black leading-none ${
                        me.busted ? "text-red-500" : "text-fuchsia-100"
                      }`}
                    >
                      {me.scoreTotal}
                    </span>
                    <span className="text-[8px] uppercase font-black tracking-widest text-gray-500">
                      Equilibrium
                    </span>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-2">
                  <Sparkles size={16} className="text-yellow-400" />
                  <span className="text-xl font-mono font-bold">
                    {me.chips}
                  </span>
                </div>
              </div>

              {isMyTurn && !isRoundOver && (
                <div className="flex bg-black/50 p-1.5 rounded-xl border border-gray-800 shadow-inner">
                  <button
                    onClick={() => setPlayMode("NORMAL")}
                    className={`px-2 sm:px-4 py-2 text-[8px] font-black tracking-widest uppercase rounded-lg transition-all ${
                      playMode === "NORMAL"
                        ? "bg-fuchsia-600 text-white shadow-lg"
                        : "text-gray-500 hover:text-gray-400"
                    }`}
                  >
                    Signal
                  </button>
                  <button
                    onClick={() => setPlayMode("FACEDOWN")}
                    className={`px-2 sm:px-4 py-2 text-[8px] font-black tracking-widest uppercase rounded-lg transition-all ${
                      playMode === "FACEDOWN"
                        ? "bg-fuchsia-600 text-white shadow-lg"
                        : "text-gray-500 hover:text-gray-400"
                    }`}
                  >
                    Override
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto pt-6 pb-8 px-4 justify-start lg:justify-center items-end h-64 scrollbar-hide scroll-smooth">
              {sortedHand.map((card) => (
                <div
                  key={card.originalIdx}
                  className={`${
                    isMyTurn ? "hover:translate-y-[-10px]" : ""
                  } transition-transform duration-300 shrink-0`}
                >
                  <CardDisplay
                    suit={card.suit}
                    val={card.val}
                    faceDown={playMode === "FACEDOWN"}
                    onClick={() =>
                      isMyTurn &&
                      playCard(card.originalIdx, playMode === "FACEDOWN")
                    }
                    disabled={!isMyTurn}
                    highlight={isMyTurn}
                  />
                </div>
              ))}
              {me.hand.length === 0 && gameState.trick.length > 0 && (
                <div className="text-gray-600 font-black uppercase text-xs animate-pulse">
                  Syncing Pulse...
                </div>
              )}
              {me.hand.length === 0 &&
                gameState.trick.length === 0 &&
                !isRoundOver &&
                gameState.status !== "finished" && (
                  <div className="text-fuchsia-600 font-black uppercase text-xs animate-pulse">
                    Protocol Initializing...
                  </div>
                )}
            </div>
          </div>
        </div>

        {showLogs && (
          <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 w-full max-w-md h-[60vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
              <div className="p-4 bg-gray-950 flex justify-between items-center border-b border-gray-800">
                <span className="font-serif font-black text-fuchsia-500 tracking-widest uppercase text-sm">
                  System_Logs
                </span>
                <button onClick={() => setShowLogs(false)}>
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {[...gameState.logs].reverse().map((l, i) => (
                  <div
                    key={i}
                    className={`text-[10px] font-mono p-2 border-l-2 bg-black/30 ${
                      l.type === "success"
                        ? "border-fuchsia-500 text-fuchsia-300"
                        : l.type === "danger"
                        ? "border-red-500 text-red-300"
                        : "border-gray-700 text-gray-500"
                    }`}
                  >
                    {l.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {gameState.status === "finished" && (
          <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col items-center justify-center p-4 backdrop-blur-2xl">
            <div className="relative mb-10">
              <Trophy
                size={100}
                className="text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)] animate-bounce"
              />
              <span className="absolute -top-4 -right-4 text-fuchsia-400 animate-pulse">
                <Sparkles size={32} />
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-serif font-black text-white mb-2 uppercase tracking-[0.4em] text-center">
              SYNCHRONIZED
            </h1>
            <div className="bg-fuchsia-950/40 border border-fuchsia-500/30 px-6 py-2 rounded-full mb-12">
              <p className="text-fuchsia-400 font-mono text-xs tracking-[0.2em] uppercase font-black">
                Protocol_Victor:{" "}
                <span className="text-white ml-2">{victor?.name}</span>
              </p>
            </div>

            <div className="w-full max-w-lg space-y-3 mb-16 overflow-y-auto max-h-[30vh]">
              <h3 className="text-center text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4">
                Unit Summary
              </h3>
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    p.id === victor.id
                      ? "bg-fuchsia-900/30 border-fuchsia-500 shadow-lg shadow-fuchsia-900/20"
                      : "bg-black/40 border-gray-800 opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User
                      size={18}
                      className={
                        p.id === victor.id
                          ? "text-fuchsia-400"
                          : "text-gray-600"
                      }
                    />
                    <span
                      className={`font-black text-sm uppercase tracking-wider ${
                        p.id === victor.id
                          ? "text-fuchsia-100"
                          : "text-gray-400"
                      }`}
                    >
                      {p.name}
                    </span>
                    {p.ready && p.id !== gameState.hostId && (
                      <CheckCircle size={14} className="text-green-500 ml-2" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-yellow-400" />
                    <span className="font-mono text-lg font-bold">
                      {p.chips}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 w-full max-w-sm">
              {isHost ? (
                <>
                  {!allGuestsReady && (
                    <div className="flex items-center justify-center gap-2 text-red-400 text-[10px] font-black uppercase tracking-widest animate-pulse mb-2">
                      <Signal size={12} /> Awaiting Signal from Observers...
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={restartGame}
                      disabled={!allGuestsReady}
                      className={`py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl transition-all ${
                        allGuestsReady
                          ? "bg-fuchsia-700 hover:bg-fuchsia-600 text-white shadow-fuchsia-900/20"
                          : "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <RotateCcw size={16} /> Reboot
                    </button>
                    <button
                      onClick={() => {
                        const resetPlayers = gameState.players.map((p) => ({
                          ...p,
                          ready: false,
                        }));
                        updateDoc(
                          doc(
                            db,
                            "artifacts",
                            APP_ID,
                            "public",
                            "data",
                            "rooms",
                            roomId
                          ),
                          {
                            status: "lobby",
                            roundCount: 1,
                            roundResult: null,
                            reserve: 0,
                            players: resetPlayers,
                          }
                        );
                        setShowLeaveConfirm(false);
                      }}
                      disabled={!allGuestsReady}
                      className={`py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 border transition-all ${
                        allGuestsReady
                          ? "border-fuchsia-600 text-fuchsia-400 hover:bg-fuchsia-900/20"
                          : "border-gray-800 text-gray-600 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <Home size={16} /> Backroom
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={setPlayerReady}
                  disabled={me?.ready}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl transition-all ${
                    me?.ready
                      ? "bg-black/50 border border-green-500 text-green-500 cursor-default"
                      : "bg-fuchsia-700 hover:bg-fuchsia-600 text-white shadow-fuchsia-900/20"
                  }`}
                >
                  {me?.ready ? (
                    <>
                      <CheckCircle size={20} /> Signal_Acquired
                    </>
                  ) : (
                    <>
                      <Signal size={20} /> Transmit_Readiness
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleLeaveRoom}
                className="w-full bg-transparent hover:bg-red-950/20 text-gray-600 hover:text-red-400 py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all"
              >
                Sever_Connection
              </button>
            </div>
          </div>
        )}
        <SpectrumLogo />
      </div>
    );
  }

  return null;
}