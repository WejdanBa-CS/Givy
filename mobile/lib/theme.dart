import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Exact tokens from Figma Make GiftRegistryAppDevelopment (Warm Editorial)
class GivyColors {
  static const ink = Color(0xFF1C1108);
  static const inkSoft = Color(0xFF8A6F5E);
  static const background = Color(0xFFFEF6EE);
  static const paper = Color(0xFFFFFFFF);
  static const muted = Color(0xFFF5EDE4);
  static const secondary = Color(0xFFFFF0E6);
  static const border = Color(0xFFE8D9CC);
  static const coral = Color(0xFFE8391E);
  static const coralDeep = Color(0xFFC92E16);
  static const gold = Color(0xFFFFCD3C);
  static const goldSoft = Color(0xFFFFE9A8);
  static const mist = Color(0xFFFEF6EE);
  static const mistDeep = Color(0xFFF5EDE4);
  static const leaf = Color(0xFF2A7A2A);
  static const leafSoft = Color(0xFF9DC88D);
  static const amber = Color(0xFFFFCD3C);
  static const line = Color(0xFFE8D9CC);
  static const placeholder = Color(0xFFC4AFA5);
  static const radius = 20.0;
}

ThemeData buildGivyTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: GivyColors.coral,
      primary: GivyColors.coral,
      secondary: GivyColors.gold,
      surface: GivyColors.paper,
      onPrimary: Colors.white,
      onSurface: GivyColors.ink,
    ),
    scaffoldBackgroundColor: GivyColors.background,
  );

  return base.copyWith(
    textTheme: GoogleFonts.dmSansTextTheme(base.textTheme).apply(
      bodyColor: GivyColors.ink,
      displayColor: GivyColors.ink,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: GivyColors.background.withValues(alpha: 0.9),
      elevation: 0,
      scrolledUnderElevation: 0,
      foregroundColor: GivyColors.ink,
      titleTextStyle: GoogleFonts.fraunces(
        fontSize: 22,
        fontWeight: FontWeight.w900,
        color: GivyColors.ink,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: GivyColors.coral,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        textStyle: GoogleFonts.dmSans(fontWeight: FontWeight.w900, fontSize: 14),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: GivyColors.ink,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        side: const BorderSide(color: GivyColors.border, width: 2),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        backgroundColor: GivyColors.paper,
        textStyle: GoogleFonts.dmSans(fontWeight: FontWeight.w900, fontSize: 14),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFFFAFAF7),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: GivyColors.border, width: 2),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: GivyColors.border, width: 2),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: GivyColors.coral, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      hintStyle: const TextStyle(color: GivyColors.placeholder),
    ),
    cardTheme: CardThemeData(
      color: GivyColors.paper,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: GivyColors.border, width: 2),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: GivyColors.paper,
      indicatorColor: GivyColors.secondary,
      elevation: 0,
      labelTextStyle: WidgetStatePropertyAll(
        GoogleFonts.dmSans(fontWeight: FontWeight.w800, fontSize: 11),
      ),
    ),
    dividerColor: GivyColors.border,
  );
}

TextStyle givyDisplay({
  double size = 32,
  FontWeight weight = FontWeight.w900,
  Color color = GivyColors.ink,
  double height = 1.05,
  FontStyle style = FontStyle.normal,
}) {
  return GoogleFonts.fraunces(
    fontSize: size,
    fontWeight: weight,
    color: color,
    letterSpacing: -0.4,
    height: height,
    fontStyle: style,
  );
}
