# Room
-keep class androidx.room.** { *; }
-dontwarn androidx.room.paging.**

# Keep Room entities and DAOs generated code
-keep @androidx.room.Entity class * { *; }
-keep @androidx.room.Dao class * { *; }

# DataStore preferences use protobuf-lite internally; keep generated schema
-keep class androidx.datastore.*.** { *; }

# Kotlin coroutines
-dontwarn kotlinx.coroutines.**

# Keep calculator engine (public API used via reflection-free calls, but keep names for clarity in stack traces)
-keep class com.calcura.app.core.calculator.** { *; }
