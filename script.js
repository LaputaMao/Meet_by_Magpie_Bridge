// 等待DOM加载完毕
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const startScreen = document.getElementById('startScreen');
    const canvas = document.getElementById('scene');

    // 1. 初始化场景、相机、渲染器
    let scene, camera, renderer, controls;
    const niulangPoints = [
        new THREE.Vector3(-30, 50, -100), // 1(x, y, z)
        new THREE.Vector3(-10, 50, -100),  // 3
        new THREE.Vector3(-18, 30, -100),  // 4
        new THREE.Vector3(-23, 18, -100),  // 6
        new THREE.Vector3(-18, 11, -100),  // 8
        new THREE.Vector3(-20, 6, -100),
    ];
    const zhinuPoints = [
        new THREE.Vector3(30, 50, -100),
        new THREE.Vector3(50, 43, -100),
        new THREE.Vector3(48, 29, -100),
        new THREE.Vector3(30, 22, -100),
        new THREE.Vector3(30, 7, -100),
        new THREE.Vector3(48, 11, -100),
        new THREE.Vector3(16, 39, -100),//12
    ];

    function init() {
        // 创建场景
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0b0b2a); // 设置场景背景色

        // 创建相机 (视角, 宽高比, 近截面, 远截面)
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 10); // 设置摄像机初始位置（在鹊桥的"起点"后方）

        // 创建渲染器，绑定到canvas元素上
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        // 4. 添加光源
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // 环境光
        scene.add(ambientLight);


        // 创建niulangzhinv星座
        const niulang = createConstellation(niulangPoints, 0xa0d8ef, 'niulang'); // 蓝色
        const zhinu = createConstellation(zhinuPoints, 0xf5b1aa, 'zhinv');   // 粉红色

        scene.add(niulang);
        scene.add(zhinu);


        // 设置轨道控制器
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.03;
        // **修改点：保持 controls.target 在原点**
        controls.target.set(0, 2, 0);
        controls.update();

        //pointsMaterial
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 5000;

        // 3. 创建一个Float32Array来存储每个粒子的坐标 (x, y, z)
        const positions = new Float32Array(particleCount * 3);

        // 同时创建一个数组来存储每个粒子的初始随机速度
        const velocityArray = new Float32Array(particleCount);

        const minRadius = 50; // 星云的半径
        const maxRadius = 150; // 星云的半径

        // 4. 循环遍历，为每个粒子设置随机位置
        for (let i = 0; i < particleCount; i++) {
            // 通过在 -X 到 X 范围内生成随机数，来模拟一个立方体区域的星空
            // 这里范围是 -50 到 50，你可以根据需要调整
            // positions[i] = (Math.random() - 0.5) * 100;

            //设置随机位置
            let i3 = i * 3;
            const radius = Math.random() * (maxRadius - minRadius) + minRadius; // 随机半径
            // 随机生成两个角度，决定点在球面上的位置
            const theta = Math.random() * Math.PI * 2; // 围绕Y轴旋转的角度 [0, 2π]
            const phi = Math.acos((Math.random() * 2) - 1); // 与Y轴的夹角 [0, π]

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta); // x
            positions[i3 + 1] = radius * Math.cos(phi); // y
            positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);  // z

            //为每个粒子储存一个随机的闪烁速度
            velocityArray[i] = Math.random() * 0.5 + 0.1; // 每个粒子的闪烁速度
        }

        // 5. 将位置数据设置为几何体的 'position' 属性
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // 6. 创建粒子材质
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.25,          // 每个粒子的大小
            color: 0x90b4ff,    // 粒子的颜色（十六进制，白色）
            transparent: true,  // 启用透明度！这对于制作淡入淡出效果至关重要
            opacity: 0.8,       // 整体的不透明度（需要 transparent: true）
            sizeAttenuation: true, // 尺寸衰减。true表示粒子离相机越远显得越小，透视效果更真实。

            // 高级选项（让你的星空更逼真）：
            blending: THREE.AdditiveBlending, // 叠加混合模式。让粒子重叠的部分更亮，像真正的星星一样。
            depthWrite: false, // 在需要大量透明粒子叠加时，禁用深度写入可以解决渲染问题，让画面更干净。
        });

        // 7. 创建最终的粒子系统
        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);

        // 8. 将粒子系统添加到场景中
        scene.add(particleSystem);

        //======================星云结束=======================

        // 动画循环
        // --- 让星星闪烁 ---
        // 获取几何体位置属性的引用
        // particleGeometry 已经是几何体了，所以不需要再访问 .geometry
        const p_positions = particleGeometry.attributes.position.array;
        let clock = new THREE.Clock();// 用于获取统一的时间

        function animate() {
            requestAnimationFrame(animate);
            controls.update();// 更新控制器

            const time = Date.now() * 0.001;
            const elapsedTime = clock.getElapsedTime(); // 获取从时钟开始到现在的总时间（秒）

            // 遍历所有粒子，通过正弦函数根据时间改变其Y坐标，模拟闪烁
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                // 简单的闪烁：改变粒子大小或透明度会更高效，这里演示位置变化
                // 实际项目中，更推荐通过自定义着色器（Shader）来实现高效闪烁
                p_positions[i3 + 1] = positions[i3 + 1] + Math.sin(elapsedTime * velocityArray[i]) * 0.01;
                // p_positions[i + 1] += 0.01;
            }
            // 重要：在更改了BufferGeometry的属性后，必须告知Three.js这些属性需要更新
            particleGeometry.attributes.position.needsUpdate = true;

            // 让星座星星闪烁
            scene.traverse(object => {
                if (object.isPoints && (object.name === 'niulang' || object.name === 'zhinv')) {
                    const positions = object.geometry.attributes.position.array;
                    const originalPositions = object.userData.originalPositions || positions.slice();
                    object.userData.originalPositions = originalPositions;

                    for (let i = 0; i < positions.length; i += 3) {
                        const index = i / 3;
                        // 每个星星有不同的闪烁频率
                        const scale = 0.2 * Math.sin(time * 2 + index * 0.5) + 1000;
                        positions[i] = originalPositions[i] * scale;
                        positions[i + 1] = originalPositions[i + 1] * scale;
                        positions[i + 2] = originalPositions[i + 2] * scale;
                    }
                    object.geometry.attributes.position.needsUpdate = true;
                }
            });

            renderer.render(scene, camera);
        }
        animate();

        // 窗口大小变化时，重置渲染器和相机比例
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    // 创建niulang和zhinv星座
    function createConstellation(points, color, name) {
        const group = new THREE.Group();
        group.name = name;

        // 1. 创建发光的星星点
        const starGeometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];

        const starColor = new THREE.Color(color);

        points.forEach(point => {
            positions.push(point.x, point.y, point.z);
            colors.push(starColor.r, starColor.g, starColor.b);

            // 为每个点添加一些随机偏移，让星座更自然
            positions.push(
                point.x + (Math.random() - 0.5) * 0,
                point.y + (Math.random() - 0.5) * 0,
                point.z + (Math.random() - 0.5) * 0
            );
            colors.push(starColor.r, starColor.g, starColor.b);
        });

        starGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

        const starMaterial = new THREE.PointsMaterial({
            size: 1,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });

        const stars = new THREE.Points(starGeometry, starMaterial);
        group.add(stars);

        // 2. 创建连接线（星座的轮廓）
        const lineGeometry = new THREE.BufferGeometry();

        // 定义如何连接这些点（形成人形轮廓）
        // 这里是一个简单的人形连接示例，您可以根据需要调整
        const lineConnections = [];
        if (name === 'niulang') {
            lineConnections.push(
                1, 4,
                3, 4,
                4, 6,
                6, 8,
                8, 10,
            );
        } else if (name === 'zhinv') {
            lineConnections.push(
                1, 2,
                3, 4,
                4, 6,
                6, 8,
                6, 10,
                1, 6,
                12, 1,
            );
        }


        lineGeometry.setAttribute('position', starGeometry.attributes.position);
        lineGeometry.setIndex(lineConnections);

        const lineMaterial = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.25,
            linewidth: 1.5
        });

        const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        group.add(lines);

        return group;
    }

    // 2. 点击“开始”按钮的事件
    startBtn.addEventListener('click', () => {
        // 隐藏开始界面
        // startScreen.style.display = 'none';
        // // 显示Canvas画布
        // canvas.style.display = 'block';
        // 初始化Three.js场景
        // init();
        // 这里可以初始化并播放背景音乐
        const sound = new Howl({ src: ['LuvLetter.mp3'] }); sound.play();
        // 先将不透明度设为0，开始淡出
        startScreen.style.opacity = '0';

        // 当淡出过渡完成后，再彻底隐藏元素和显示画布
        setTimeout(() => {
            startScreen.style.display = 'none';
            // 确保 canvas 也能显示出来，或者在 CSS 中保持它的初始状态是可见的
            canvas.style.display = 'block';
            // 初始化Three.js场景
            init();
        }, 1000); // 这里的1000毫秒要和CSS中的transition时间一致

    });
});
