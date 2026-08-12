import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class GivyColors {
  static const ink = Color(0xFF10261C);
  static const inkSoft = Color(0xFF2C4A3A);
  static const mist = Color(0xFFE7F1EA);
  static const mistDeep = Color(0xFFD3E5DA);
  static const paper = Color(0xFFF4FAF6);
  static const coral = Color(0xFFFF5A3C);
  static const coralDeep = Color(0xFFE84328);
  static const leaf = Color(0xFF2F7A55);
  static const amber = Color(0xFFF0B429);
  static const line = Color(0x1F10261C);
}

ThemeData buildGivyTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: GivyColors.coral,
      primary: GivyColors.coral,
      secondary: GivyColors.leaf,
      surface: Colors.white,
      onPrimary: Colors.white,
      onSurface: GivyColors.ink,
    ),
    scaffoldBackgroundColor: Colors.transparent,
  );

  return base.copyWith(
    textTheme: GoogleFonts.plusJakartaSansTextTheme(base.textTheme).apply(
      bodyColor: GivyColors.ink,
      displayColor: GivyColors.ink,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      foregroundColor: GivyColors.ink,
      titleTextStyle: GoogleFonts.fraunces(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        color: GivyColors.ink,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: GivyColors.coral,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: const StadiumBorder(),
        textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: GivyColors.ink,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        side: const BorderSide(color: GivyColors.line),
        shape: const StadiumBorder(),
        backgroundColor: Colors.white.withValues(alpha: 0.72),
        textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white.withValues(alpha: 0.78),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: GivyColors.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: GivyColors.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: GivyColors.coral, width: 1.4),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    cardTheme: CardThemeData(
      color: Colors.white.withValues(alpha: 0.72),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: GivyColors.line),
      ),
    ),
  );
}

TextStyle givyDisplay({
  double size = 32,
  FontWeight weight = FontWeight.w600,
  Color color = GivyColors.ink,
}) {
  return GoogleFonts.fraunces(
    fontSize: size,
    fontWeight: weight,
    color: color,
    letterSpacing: -0.5,
  );
}
