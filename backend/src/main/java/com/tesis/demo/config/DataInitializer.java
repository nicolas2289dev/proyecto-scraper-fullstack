package com.tesis.demo.config;

import com.tesis.demo.model.Rol;
import com.tesis.demo.model.Sucursal;
import com.tesis.demo.model.Supermercado;
import com.tesis.demo.model.Usuario;
import com.tesis.demo.model.UsuarioRol;
import com.tesis.demo.repository.RolRepository;
import com.tesis.demo.repository.SucursalRepository;
import com.tesis.demo.repository.SupermercadoRepository;
import com.tesis.demo.repository.UsuarioRepository;
import com.tesis.demo.repository.UsuarioRolRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.Optional;

@Component
@Profile("!prod")  // No ejecutar en producción
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioRolRepository usuarioRolRepository;
    private final SupermercadoRepository supermercadoRepository;
    private final SucursalRepository sucursalRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(RolRepository rolRepository,
                           UsuarioRepository usuarioRepository,
                           UsuarioRolRepository usuarioRolRepository,
                           SupermercadoRepository supermercadoRepository,
                           SucursalRepository sucursalRepository,
                           PasswordEncoder passwordEncoder) {
        this.rolRepository = rolRepository;
        this.usuarioRepository = usuarioRepository;
        this.usuarioRolRepository = usuarioRolRepository;
        this.supermercadoRepository = supermercadoRepository;
        this.sucursalRepository = sucursalRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. Inicializar roles si no existen
        Rol adminRol = initRol("ADMIN");
        Rol userRol = initRol("USER");

        // 2. Inicializar supermercados si no existen
        Supermercado comodin = initSupermercado("Comodín en Casa", "https://www.comodinencasa.com.ar");
        Supermercado dia = initSupermercado("Día", "https://diaonline.supermercadosdia.com.ar");
        Supermercado vea = initSupermercado("Vea", "https://www.vea.com.ar");

        // 3. Inicializar sucursales geolocalizadas de Jujuy si no existen
        initSucursalesJujuy(comodin, dia, vea);

        // 4. Inicializar usuario admin de prueba si no existe
        initUsuario(
                "admin@tesis.com",
                "admin123",
                "Administrador",
                "ACTIVO",
                adminRol
        );

        // 5. Inicializar usuario de prueba adicional (opcional)
        initUsuario(
                "usuario@tesis.com",
                "usuario123",
                "Usuario",
                "ACTIVO",
                userRol
        );
    }

    private Rol initRol(String nombre) {
        Optional<Rol> existing = rolRepository.findByNombreRol(nombre);
        if (existing.isEmpty()) {
            Rol rol = new Rol();
            rol.setNombreRol(nombre);
            return rolRepository.save(rol);
        }
        return existing.get();
    }

    private Supermercado initSupermercado(String nombre, String urlBase) {
        Optional<Supermercado> existing = supermercadoRepository.findByNombreEquivalent(nombre);
        if (existing.isEmpty()) {
            Supermercado supermercado = new Supermercado();
            supermercado.setNombre(nombre);
            supermercado.setUrlBase(urlBase);
            Supermercado saved = supermercadoRepository.save(supermercado);
            log.info("[DataInitializer] Supermercado creado: {}", nombre);
            return saved;
        }
        return existing.get();
    }

    private void initSucursalesJujuy(Supermercado comodin, Supermercado dia, Supermercado vea) {
        // Sucursales Comodín
        initSucursal(comodin, "Comodín Sucursal Alberdi (Centro)", "Alberdi 164", "San Salvador de Jujuy", -24.1879, -65.3061);
        initSucursal(comodin, "Comodín Sucursal Éxodo", "Av. El Éxodo 561", "San Salvador de Jujuy", -24.1912, -65.3045);
        initSucursal(comodin, "Comodín Sucursal Almirante Brown", "Av. Almirante Brown 924", "San Salvador de Jujuy", -24.1984, -65.2942);
        initSucursal(comodin, "Comodín Sucursal Ciudad de Nieva", "Av. Libertad 670", "San Salvador de Jujuy", -24.1815, -65.3198);
        initSucursal(comodin, "Comodín Sucursal Alto Comedero", "Av. Fuerza Aérea 290", "San Salvador de Jujuy", -24.2385, -65.2651);
        initSucursal(comodin, "Comodín Sucursal Palpalá", "Av. Martijena 215", "Palpalá", -24.2568, -65.2074);
        initSucursal(comodin, "Comodín Sucursal Perico", "Av. Belgrano 430", "Perico", -24.3821, -65.1132);
        initSucursal(comodin, "Comodín Sucursal San Pedro Mitre", "Bartolomé Mitre 436", "San Pedro de Jujuy", -24.229346, -64.867706);
        initSucursal(comodin, "Comodín Sucursal San Pedro Alberdi", "Juan B. Alberdi 52", "San Pedro de Jujuy", -24.234462, -64.866341);

        // Sucursales Día
        initSucursal(dia, "Día Peatonal Belgrano", "Av. Gral. Belgrano 860", "San Salvador de Jujuy", -24.1856, -65.3023);
        initSucursal(dia, "Día Senador Pérez", "Senador Pérez 345", "San Salvador de Jujuy", -24.1842, -65.3069);
        initSucursal(dia, "Día Necochea", "Necochea 250", "San Salvador de Jujuy", -24.1868, -65.3011);
        initSucursal(dia, "Día Hipólito Yrigoyen", "Av. Hipólito Yrigoyen 1120", "San Salvador de Jujuy", -24.1930, -65.2985);
        initSucursal(dia, "Día Almirante Brown", "Av. Almirante Brown 1280", "San Salvador de Jujuy", -24.2015, -65.2918);
        initSucursal(dia, "Día Palpalá Centro", "Av. Río de la Plata 310", "Palpalá", -24.2584, -65.2052);
        initSucursal(dia, "Día Perico Centro", "Mariano Moreno 185", "Perico", -24.3809, -65.1148);
        initSucursal(dia, "Día San Pedro Centro", "Gobernador Tello 215", "San Pedro de Jujuy", -24.23298, -64.86598);

        // Sucursales Vea
        initSucursal(vea, "Vea Av. El Éxodo", "Av. El Éxodo 352", "San Salvador de Jujuy", -24.1904, -65.3028);
        initSucursal(vea, "Vea Belgrano Centro", "Av. Gral. Belgrano 980", "San Salvador de Jujuy", -24.1851, -65.3048);
        initSucursal(vea, "Vea Chijra", "Av. Gral. Mosconi 245", "San Salvador de Jujuy", -24.1755, -65.2862);
        initSucursal(vea, "Vea San Pedro Centro", "Av. Siria 164", "San Pedro de Jujuy", -24.2338, -64.8649);
    }

    private void initSucursal(Supermercado supermercado, String nombreSucursal, String direccion, String ciudad, Double latitud, Double longitud) {
        if (supermercado == null || supermercado.getId() == null) {
            return;
        }
        Optional<Sucursal> existing = sucursalRepository.findBySupermercadoIdAndNombreSucursalIgnoreCase(supermercado.getId(), nombreSucursal);
        if (existing.isEmpty()) {
            Sucursal sucursal = Sucursal.builder()
                    .supermercado(supermercado)
                    .nombreSucursal(nombreSucursal)
                    .direccion(direccion)
                    .ciudad(ciudad)
                    .latitud(latitud)
                    .longitud(longitud)
                    .build();
            sucursalRepository.save(sucursal);
            log.info("[DataInitializer] Sucursal creada: {} ({})", nombreSucursal, ciudad);
        } else {
            Sucursal sucursal = existing.get();
            boolean changed = false;
            if (!Objects.equals(sucursal.getLatitud(), latitud) || !Objects.equals(sucursal.getLongitud(), longitud)) {
                sucursal.setLatitud(latitud);
                sucursal.setLongitud(longitud);
                changed = true;
            }
            if (!Objects.equals(sucursal.getDireccion(), direccion)) {
                sucursal.setDireccion(direccion);
                changed = true;
            }
            if (changed) {
                sucursalRepository.save(sucursal);
                log.info("[DataInitializer] Sucursal actualizada con coordenadas calibradas: {} ({})", nombreSucursal, ciudad);
            }
        }
    }

    private void initUsuario(String email, String password, String nombre, String estado, Rol rol) {
        Optional<Usuario> existing = usuarioRepository.findByEmail(email);
        if (existing.isEmpty()) {
            Usuario usuario = new Usuario();
            usuario.setEmail(email);
            usuario.setPassword(passwordEncoder.encode(password)); // Encriptar contraseña
            usuario.setNombre(nombre);
            usuario.setEstado(estado);
            usuario = usuarioRepository.save(usuario);

            // Asignar rol al usuario
            UsuarioRol usuarioRol = new UsuarioRol();
            usuarioRol.setUsuario(usuario);
            usuarioRol.setRol(rol);
            usuarioRolRepository.save(usuarioRol);

            log.info("[DataInitializer] Usuario creado: {}", email);  // Contraseña no se loguea
        }
    }
}
